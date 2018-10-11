﻿// ***********************************************************************
// Assembly         : Microsoft.Legal.MatterCenter.Utility
// Author           : v-lapedd
// Created          : 04-07-2016
//
// ***********************************************************************
// <copyright file="SPOAuthorization.cs" company="Microsoft">
//     Copyright (c) . All rights reserved.
// </copyright>

// ***********************************************************************

using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.SharePoint.Client;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System.Globalization;
using Microsoft.AspNetCore.Http;


#region Matter Namespaces
using Microsoft.Legal.MatterCenter.Models;
using System.Reflection;
using System.Net;
using System.Text;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
#endregion

namespace Microsoft.Legal.MatterCenter.Utility
{
    /// <summary>
    /// This class is used for reading authorization token which has been sent by the client.This
    /// class will validate the client token, get the token  for the service from Azure Active Directory
    /// and pass the service token to sharepoint
    /// </summary>
    public class SPOAuthorization: ISPOAuthorization
    {
        private GeneralSettings generalSettings;
        private ErrorSettings errorSettings;
        private ICustomLogger customLogger;
        private LogTables logTables;
        private string accessToken;
        private string accountName;
        private IHttpContextAccessor httpContextAccessor;
        /// <summary>
        /// Constructor where GeneralSettings and ErrorSettings are injected
        /// </summary>
        /// <param name="generalSettings"></param>
        /// <param name="errorSettings"></param>
        public SPOAuthorization(IOptions<GeneralSettings> generalSettings, 
            IOptions<ErrorSettings> errorSettings, 
            IOptions<LogTables> logTables, 
            ICustomLogger customLogger, 
            IHttpContextAccessor httpContextAccessor)
        {            
            this.generalSettings = generalSettings.Value;
            this.errorSettings = errorSettings.Value;
            this.customLogger = customLogger;
            this.logTables = logTables.Value;
            this.httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Get HttpContext object from IHttpContextAccessor to read Http Request Headers
        /// </summary>
        private HttpContext Context => httpContextAccessor.HttpContext;   

        /// <summary>
        /// This method will get the access token for the service and creats SharePoint ClientContext object and returns that object
        /// </summary>
        /// <param name="url">The SharePoint Url for which the client context needs to be creatwed</param>
        /// <returns>ClientContext - Return SharePoint Client Context Object</returns>
        public ClientContext GetClientContext(string url)
        {
            try
            { 
                string accessToken = GetAccessToken().Result;

                //JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
                //JwtSecurityToken token = handler.ReadJwtToken(accessToken);
                
                ////MatterCenterWeb08131451.azurewebsites.net /
                ////Decode Access Token JWT
                ////Replace App ID with the URL 
                //string strURL = "https://MatterCenterWeb08131451.azurewebsites.net/";
                ////string[] tokens = accessToken.Split('.');
                //token.Payload["aud"] = strURL;
                //token.Payload["appid"] = strURL;
                //string modifiedAccessToken = handler.WriteToken(token);
                //if (tokens.Length > 2)
                //{
                
                //    string encodedPayload = Encoding.UTF8.GetString(Convert.FromBase64String(tokens[1]));
                //    if (!string.IsNullOrEmpty(encodedPayload))
                //    {
                //        AccessTokenPayload payload = JsonConvert.DeserializeObject<AccessTokenPayload>(encodedPayload);
                //        payload.appid = strURL;
                //        tokens[1] = JsonConvert.SerializeObject(payload);
                //        modifiedAccessToken = string.Join(".", tokens);
                //    }
                //}
                return GetClientContextWithAccessToken(Convert.ToString(url, CultureInfo.InvariantCulture), accessToken);
                //return GetClientContextWithAccessToken(Convert.ToString(url, CultureInfo.InvariantCulture), modifiedAccessToken);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// This method will get the access token for the Microsoft Graph and returns that token
        /// </summary>
        /// <param name="url">The SharePoint Url for which the client context needs to be creatwed</param>
        /// <returns>ClientContext - Return SharePoint Client Context Object</returns>
        public string GetGraphAccessToken()
        {
            try
            {
                return GetAccessTokenForGraph().Result;

            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// This method will get the access token for the Exchange online and returns that token
        /// </summary>
        /// <param name="url">The SharePoint Url for which the client context needs to be creatwed</param>
        /// <returns>ClientContext - Return SharePoint Client Context Object</returns>
        public string GetExchangeAccessToken()
        {
            try
            {
                return GetAccessTokenForExchange().Result;

            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }




        /// <summary>
        /// This method will get token for exchange online so that
        /// we can pass the token to exchange online to get the required data.
        /// </summary>
        /// <returns>Access Token for the web api service</returns>
        private async Task<string> GetAccessTokenForGraph()
        {
            try
            {
                return  await GetTokenForResource(generalSettings.GraphUrl);
               
            }
            catch (AggregateException ex)
            {
                throw;
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// This helper method will get token access form the Azure Active Directory for the 
        /// resource application that is being passed as a parameter.       
        /// </summary>
        /// <returns>Access Token for the web api service</returns>
        private async Task<string> GetTokenForResource(string resourceUrl)
        {
            try
            {
                string clientId = generalSettings.ClientId;
                string appKey = generalSettings.AppKey;
                string aadInstance = generalSettings.AADInstance;
                string tenant = generalSettings.Tenant;
                string resource = resourceUrl;
                ClientCredential clientCred = new ClientCredential(clientId, appKey);
                string accessToken = Context.Request.Headers["Authorization"].ToString().Split(' ')[1];
                //Error JWT Bearer Token? Changeed Code (updated signature)
                UserAssertion userAssertion = new UserAssertion(accessToken,"urn:ietf:params:oauth:grant-type:jwt-bearer"); //Swapped
                //UserAssertion userAssertion = new UserAssertion(accessToken); //Original Code
                string authority = String.Format(CultureInfo.InvariantCulture, aadInstance, tenant);
                //ToDo: Set the TokenCache to null. Need to implement custom token cache to support multiple users
                //If we dont have the custom cache, there will be some performance overhead.
                AuthenticationContext authContext = new AuthenticationContext(authority, null);
                AuthenticationResult result = await authContext.AcquireTokenAsync(resource, clientCred, userAssertion);
                return result.AccessToken;
            }
            catch (AggregateException ex)
            {
                throw;
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }


        /// <summary>
        /// This method will get token for exchange online so that
        /// we can pass the token to exchange online to get the required data.
        /// </summary>
        /// <returns>Access Token for the web api service</returns>
        private async Task<string> GetAccessTokenForExchange()
        {
            try
            {
                return await GetTokenForResource(generalSettings.ExchangeURL);               
            }
            catch (AggregateException ex)
            {
                throw;
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// This method will get token for exchange online so that
        /// we can pass the token to exchange online to get the required data.
        /// </summary>
        /// <returns>Access Token for the web api service</returns>
        private async Task<string> GetAccessToken()
        {
            try
            {
                return await GetTokenForResource(generalSettings.SiteURL);  //replacing with GUID to address issue debugging
                //return await GetTokenForResource("2d5b12b8-3fd7-45f3-8e5a-dfae04afe737");  //MatterCenterWeb08131451.azurewebsites.net/ (published azure app)



            }
            catch(AggregateException ex)
            {
                throw;
            }
            catch(Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Uses the specified access token to create a client context. For each and every request to SPO
        /// an authorization header will be sent. With out authorization header, SPO will reject the request
        /// </summary>
        /// <param name="targetUrl">URL of the target SharePoint site</param>
        /// <param name="accessToken">Access token to be used when calling the specified targetUrl</param>
        /// <returns>A ClientContext ready to call targetUrl with the specified access token</returns>
        private ClientContext GetClientContextWithAccessToken(string targetUrl, string accessToken)
        {
            try
            {
                ClientContext clientContext = new ClientContext(targetUrl);       
                clientContext.AuthenticationMode = ClientAuthenticationMode.Anonymous;
                clientContext.FormDigestHandlingEnabled = false;
                
                clientContext.ExecutingWebRequest +=
                    delegate (object oSender, WebRequestEventArgs webRequestEventArgs)
                    {
                        //For each SPO request, need to set bearer token to the Authorization request header
                        webRequestEventArgs.WebRequestExecutor.RequestHeaders["Authorization"] =
                            "Bearer " + accessToken;
                    };
                return clientContext;
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }
    }
}
