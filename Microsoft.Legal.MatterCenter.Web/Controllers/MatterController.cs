﻿// ***********************************************************************
// Assembly         : Microsoft.Legal.MatterCenter.ProviderService
// Author           : v-lapedd
// Created          : 04-09-2016
//
// ***********************************************************************
// <copyright file="MatterController.cs" company="Microsoft">
//     Copyright (c) . All rights reserved.
// </copyright>
// <summary>This file defines service for Taxonomy</summary>
// ***********************************************************************

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Net;
using System.Reflection;
using System.Globalization;
#region Matter Namespaces
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.Legal.MatterCenter.Repository;
using Microsoft.Legal.MatterCenter.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Legal.MatterCenter.Web.Common;
using System.Collections.Generic;
using Microsoft.SharePoint.Client;
#endregion
namespace Microsoft.Legal.MatterCenter.Service
{
    /// <summary>
    /// Matter Controller class deals with matter provisioning, finding matter, pinning matter, unpinning the matterm, updating the matter
    /// </summary>
    [Authorize(ActiveAuthenticationSchemes = "Bearer")]
    [Route("api/v1/matter")]
    public class MatterController : Controller
    {
        private ErrorSettings errorSettings;
        
        private IMatterCenterServiceFunctions matterCenterServiceFunctions;
        private MatterSettings matterSettings;
        private IMatterRepository matterRepositoy;
        private ICustomLogger customLogger;
        private LogTables logTables;
        private IValidationFunctions validationFunctions;
        private IEditFunctions editFunctions;
        private IMatterProvision matterProvision;
        private ISPOAuthorization spoAuthorization;
        /// <summary>
        /// Constructor where all the required dependencies are injected
        /// </summary>
        /// <param name="errorSettings"></param>
        /// <param name="matterSettings"></param>
        /// <param name="matterCenterServiceFunctions"></param>
        /// <param name="matterRepositoy"></param>
        /// <param name="customLogger"></param>
        /// <param name="logTables"></param>
        /// <param name="validationFunctions"></param>
        /// <param name="editFunctions"></param>
        /// <param name="matterProvision"></param>
        public MatterController(IOptions<ErrorSettings> errorSettings,
            IOptions<MatterSettings> matterSettings,
            
            IMatterCenterServiceFunctions matterCenterServiceFunctions,
            IMatterRepository matterRepositoy,
            ICustomLogger customLogger, IOptions<LogTables> logTables,
            IValidationFunctions validationFunctions,
            IEditFunctions editFunctions,
            IMatterProvision matterProvision,
            ISPOAuthorization spoAuthorization
            )
        {
            this.errorSettings = errorSettings.Value;
            this.matterSettings = matterSettings.Value;            
            this.matterCenterServiceFunctions = matterCenterServiceFunctions;
            this.matterRepositoy = matterRepositoy;
            this.customLogger = customLogger;
            this.logTables = logTables.Value;
            this.validationFunctions = validationFunctions;
            this.editFunctions = editFunctions;
            this.matterProvision = matterProvision;
            this.spoAuthorization = spoAuthorization;
        }

        #region Pin and UnPin
        /// <summary>
        /// Get all pinned matters which are pinned by the user
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns></returns>
        [HttpPost("getpinned")]
        [Produces(typeof(SearchResponseVM))]
        [SwaggerOperation("getpinned")]
         [SwaggerResponse((int)HttpStatusCode.OK, 
            Description = "Returns Asynchronouns IActionResult which contains list pinned matters which are pinned by the user", 
            Type = typeof(SearchResponseVM))]
         
        public async Task<IActionResult> GetPin([FromBody]SearchRequestVM searchRequestVM)
        {
            try
            {                
                #region Error Checking                
                GenericResponseVM genericResponse = null;
                
                if (searchRequestVM == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        IsError = true,
                        Description = $"No input data is passed to fetch the pinned {errorSettings.Item}"
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                ClientContext clientContext = null;
                clientContext = spoAuthorization.GetClientContext(searchRequestVM.Client.Url);
                var pinResponseVM = await matterRepositoy.GetPinnedRecordsAsync(searchRequestVM, clientContext);                
                return matterCenterServiceFunctions.ServiceResponse(pinResponseVM.MatterDataList, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.OK);
            }
        }

        /// <summary>
        /// Get all counts for all matters, my matters and pinned matters
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns></returns>
        [HttpPost("getmattercounts")]        
        [SwaggerOperation("getmattercounts")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns Asynchronouns IActionResult anonymous object  which contains count of all matters, pinned matters and my matters")]
         
        public async Task<IActionResult> GetMatterCounts([FromBody]SearchRequestVM searchRequestVM)
        {
            try
            {
                //Get the authorization token from the Request header                
                GenericResponseVM genericResponse = null;
                #region Error Checking                
                if (searchRequestVM == null && searchRequestVM.Client == null && searchRequestVM.SearchObject == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to fetch  {errorSettings.Item}s count",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion                
                int allMatterCounts = await matterProvision.GetAllCounts(searchRequestVM);
                int myMatterCounts = await matterProvision.GetMyCounts(searchRequestVM);
                int pinnedMatterCounts = await matterProvision.GetPinnedCounts(searchRequestVM);
                var matterCounts = new
                {
                    AllMatterCounts = allMatterCounts,
                    MyMatterCounts = myMatterCounts,
                    PinnedMatterCounts = pinnedMatterCounts,
                };
                return matterCenterServiceFunctions.ServiceResponse(matterCounts, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }


        /// <summary>
        /// pin the matter
        /// </summary>
        /// <param name="pinRequestMatterVM"></param>
        /// <returns></returns>
        [HttpPost("pin")]
        [SwaggerOperation("pin")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns Asynchronouns IActionResult anonymous object  whether the matter is pinned or not")]
         
        public async Task<IActionResult> Pin([FromBody]PinRequestMatterVM pinRequestMatterVM)
        {
            try
            {
                
                #region Error Checking                
                GenericResponseVM genericResponse = null;                
                if (pinRequestMatterVM == null && pinRequestMatterVM.Client == null && pinRequestMatterVM.MatterData == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to pin an  {errorSettings.Item}",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                var isMatterPinned = await matterRepositoy.PinRecordAsync<PinRequestMatterVM>(pinRequestMatterVM);
                var matterPinned = new
                {
                    IsMatterPinned = isMatterPinned
                };
                return matterCenterServiceFunctions.ServiceResponse(matterPinned, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Unpin the matter
        /// </summary>
        /// <param name="pinRequestMatterVM"></param>
        /// <returns></returns>
        [HttpPost("unpin")]
        [SwaggerOperation("unpin")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns Asynchronouns IActionResult anonymous object  whether the matter is unpinned or not")]
         
        public async Task<IActionResult> UnPin([FromBody]PinRequestMatterVM pinRequestMatterVM)
        {
            try
            {

                #region Error Checking                
                GenericResponseVM genericResponse = null;                
                if (pinRequestMatterVM == null && pinRequestMatterVM.Client == null && pinRequestMatterVM.MatterData == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to fetch the unpinned  {errorSettings.Item}",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                var isMatterUnPinned = await matterRepositoy.UnPinRecordAsync<PinRequestMatterVM>(pinRequestMatterVM);
                var matterUnPinned = new
                {
                    IsMatterUnPinned = isMatterUnPinned
                };
                return matterCenterServiceFunctions.ServiceResponse(matterUnPinned, (int)HttpStatusCode.OK);

            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }
        #endregion

        #region Search Methods

        /// <summary>
        /// Gets the matters based on search criteria.
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns>searchResponseVM</returns>
        [HttpPost("get")]
        [Produces(typeof(SearchResponseVM))]
        [SwaggerOperation("get")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns Asynchronouns IActionResult of all matters where the user has got permissions", Type = typeof(SearchResponseVM))]
         
        public async Task<IActionResult> Get([FromBody]SearchRequestVM searchRequestVM)
        {
            try
            {
                #region Error Checking
                GenericResponseVM genericResponse = null;
                if (searchRequestVM == null && searchRequestVM.Client == null && searchRequestVM.SearchObject == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to get  {errorSettings.Item}s",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                ClientContext clientContext = null;
                clientContext = spoAuthorization.GetClientContext(searchRequestVM.Client.Url);
                var searchResultsVM = await matterProvision.GetMatters(searchRequestVM, clientContext);
                return matterCenterServiceFunctions.ServiceResponse(searchResultsVM.MatterDataList, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.OK);
                
            }
        }


        /// <summary>
        /// Get all folders that are there in a particular matter document library
        /// </summary>
        /// <param name="matterData"></param>
        /// <returns></returns>
        [HttpPost("getfolderhierarchy")]
        [Produces(typeof(List<FolderData>))]
        [SwaggerOperation("getFolderHierarchy")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns Asynchronouns IActionResult of all folders that are there in a particular document library", Type = typeof(List<FolderData>))]
                 
        public async Task<IActionResult> GetFolderHierachy([FromBody]MatterData matterData)
        {
            try
            {

                #region Error Checking                
                GenericResponseVM genericResponse = null;                
                if (matterData == null && string.IsNullOrWhiteSpace(matterData.MatterUrl) && string.IsNullOrWhiteSpace(matterData.MatterName))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed to get folder hierarchy",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                var folderHierarchy = await matterRepositoy.GetFolderHierarchyAsync(matterData);
                var response = new {
                    foldersList = folderHierarchy
                };
                return matterCenterServiceFunctions.ServiceResponse(response, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }
        

        /// <summary>
        /// Get all the stamped properties associated to a particular matter
        /// </summary>
        /// <param name="matterVM"></param>
        /// <returns></returns>
        [HttpPost("getstampedproperties")]
        [Produces(typeof(MatterStampedDetails))]
        [SwaggerOperation("getStampedProperties")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of all stamped properties that are associated to a matter", 
            Type = typeof(MatterStampedDetails))]
         
        public IActionResult GetStampedProperties([FromBody]MatterVM matterVM)
        {
            try
            {


                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (matterVM == null && matterVM.Client == null && matterVM.Matter != null && string.IsNullOrWhiteSpace(matterVM.Matter.Name))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed to get stamped properties",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                //ToDo: Need to concert this method to async
                var matterStampedProperties = matterProvision.GetStampedProperties(matterVM);
                //ToDo: Need to do nulk check on  matterStampedProperties
                return matterCenterServiceFunctions.ServiceResponse(matterStampedProperties, (int)HttpStatusCode.OK);
            }

            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }
        #endregion

        #region Configurations       

        /// <summary>
        /// get configurations for a selected client
        /// </summary>
        /// <param name="siteCollectionPath"></param>
        /// <returns></returns>
        [HttpPost("getconfigurations")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("getConfigurations")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of generic reposne which contains configurations for a selected client",
            Type = typeof(GenericResponseVM))]
                 
        public async Task<IActionResult> GetConfigurations([FromBody]string siteCollectionPath)
        {
            try
            {
                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (string.IsNullOrWhiteSpace(siteCollectionPath))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                }
                #endregion
                GenericResponseVM genericResponseVM = await matterRepositoy.GetConfigurationsAsync(siteCollectionPath);
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.OK);
            }
        }


        /// <summary>
        /// Method saves default matter configurations from the settings page. When the user select a client and these
        /// default configurations will be loaded by default for that client
        /// </summary>
        /// <param name="matterConfigurations"></param>
        /// <returns></returns>        
        [HttpPost("saveconfigurations")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("saveConfigurations")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of generic reposne which contains whether configuration for the matter is saved or not",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult SaveConfigurations([FromBody]MatterConfigurations matterConfigurations)
        {
            try
            {
                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (matterConfigurations==null &&  string.IsNullOrWhiteSpace(matterConfigurations.ClientUrl))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                }
                #endregion
                GenericResponseVM genericResponseVM = matterProvision.SaveConfigurations(matterConfigurations);
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.OK);
            }
        }

        #endregion

        #region Matter Provision

        /// <summary>
        /// This method will check whether the current login user can create a matter or not
        /// This method will check whether the user is present in the sharepoint group called "Provision Matter User"
        /// If the user is not present in the group, then "Create Matter" link should not be visible to the user
        /// </summary>
        /// <param name="client"></param>
        /// <returns></returns>
        [HttpPost("cancreate")]        
        [SwaggerOperation("canCreate")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of type of bool checks whether the login user can create a matter or not")]
         
        public IActionResult CanCreateMatter([FromBody]Client client)
        {
            GenericResponseVM genericResponse = null;
            if (null == client && null != client.Url)
            {
                genericResponse = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = "No input data is passed",
                    IsError = true
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
            }
            try
            {
                var canCreateMatter = matterRepositoy.CanCreateMatter(client);

                var canLoginUserCreateMatter = new
                {
                    CanCreateMatter = canCreateMatter
                };

                return matterCenterServiceFunctions.ServiceResponse(canLoginUserCreateMatter, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// This method will check whether a matter already exists with a given name
        /// </summary>
        /// <param name="matterMetadataVM"></param>
        /// <returns></returns>
        [HttpPost("checkmatterexists")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("checkMatterExists")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of generic resposne which checks whether a matter with the given name already exists or not",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult CheckMatterExists([FromBody]MatterMetdataVM matterMetadataVM)
        {
            
            GenericResponseVM genericResponse = ServiceUtility.GenericResponse(matterSettings.DeleteMatterCode, ServiceConstants.TRUE);
            var client = matterMetadataVM.Client;
            var matter = matterMetadataVM.Matter;
            var matterConfiguration = matterMetadataVM.MatterConfigurations;         
            if (null == client && null == matter && string.IsNullOrWhiteSpace(client.Url))
            {
                genericResponse = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = "No input data is passed",
                    IsError = true
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
            }
            var matterInformation = new MatterInformationVM()
            {
                Client = client,
                Matter = matter
            };
            genericResponse = validationFunctions.IsMatterValid(matterInformation, int.Parse(ServiceConstants.PROVISION_MATTER_CHECK_MATTER_EXISTS, 
                CultureInfo.InvariantCulture), null);
            if(genericResponse!=null)
            {

                genericResponse.Description = "Validation failed";
                genericResponse.IsError = true;               
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
            }
                
            try
            {
               
                if (!matterMetadataVM.HasErrorOccurred)
                {
                    genericResponse = matterProvision.CheckMatterExists(matterMetadataVM);
                    if (genericResponse != null)
                    {                        
                        genericResponse.Description = genericResponse.Value;
                        genericResponse.IsError = true;
                        return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                    }
                    else
                    {
                        genericResponse = ServiceUtility.GenericResponse(ServiceConstants.SUCCESS, ServiceConstants.TRUE);
                        return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                    }
                }
                else
                {
                    genericResponse = matterProvision.DeleteMatter(matterMetadataVM as MatterVM);
                    genericResponse.IsError = true;
                    genericResponse.Description = $"Error occured when checking whether the given {errorSettings.Item} exisits or not";
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
            }
            catch (Exception exception)
            {
                genericResponse = matterProvision.DeleteMatter(matterMetadataVM as MatterVM);
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }                
        }

        /// <summary>
        /// This method will check whether a given security group already exists or not
        /// </summary>
        /// <param name="matterInformationVM"></param>
        /// <returns></returns>
        [HttpPost("checksecuritygroupexists")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("checksecuritygroupexists")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will check whether a given security group already exists or not",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult CheckSecurityGroupExists([FromBody]MatterInformationVM matterInformationVM)
        {
            
            GenericResponseVM genericResponse = null;
            var client = matterInformationVM.Client;
            var matter = matterInformationVM.Matter;            
            
            if (null == client && null == matter && null != client.Url)
            {
                genericResponse = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = "No input data is passed",
                    IsError = true
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
            }            

            try
            {
                if (0 == matter.AssignUserEmails.Count)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.IncorrectInputUserNamesMessage,
                        Code = errorSettings.IncorrectInputUserNamesCode,
                        Description = "No input data is passed",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }

                genericResponse = matterProvision.CheckSecurityGroupExists(matterInformationVM);
                if(genericResponse != null)
                {
                   // genericResponse.Description = "No input data is passed";
                    genericResponse.IsError = true;
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                }
                genericResponse = ServiceUtility.GenericResponse(ServiceConstants.SUCCESS, ServiceConstants.TRUE);
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// This method will update a given matter information/configuration such as user matter roles, new users to the matter etc
        /// </summary>
        /// <param name="matterInformation"></param>
        /// <returns></returns>
        [HttpPost("update")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("update")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will update a given matter information/configuration such as user matter roles, new users to the matter etc",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult Update([FromBody]MatterInformationVM matterInformation)
        {
            string editMatterValidation = string.Empty;
            var matter = matterInformation.Matter;
            var client = matterInformation.Client;
            var userid = matterInformation.UserIds;
            try
            {

                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (matterInformation.Client == null && matterInformation.Matter == null && matterInformation.MatterDetails == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to update the {errorSettings.Item}",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion
                
                #region Validations
                GenericResponseVM validationResponse = validationFunctions.IsMatterValid(matterInformation, int.Parse(ServiceConstants.EditMatterPermission), null);
                if (validationResponse != null)
                {
                    validationResponse.IsError = true;
                    return matterCenterServiceFunctions.ServiceResponse(validationResponse, (int)HttpStatusCode.BadRequest);
                }

                if (null != matter.Conflict && !string.IsNullOrWhiteSpace(matter.Conflict.Identified))
                {
                    if (matter.AssignUserNames.Count == 0)
                    {
                        genericResponse = new GenericResponseVM()
                        {
                            Value = errorSettings.IncorrectInputUserNamesMessage,
                            Code = errorSettings.IncorrectInputUserNamesCode,
                            IsError = true
                        };
                        return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                    }
                    else
                    {
                        if (Convert.ToBoolean(matter.Conflict.Identified, CultureInfo.InvariantCulture))
                        {
                            validationResponse = editFunctions.CheckSecurityGroupInTeamMembers(client, matter, userid);
                            if (validationResponse != null)
                            {
                                validationResponse.IsError = true;
                                return matterCenterServiceFunctions.ServiceResponse(validationResponse, (int)HttpStatusCode.BadRequest);
                            }
                        }
                    }
                }
                else
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.IncorrectInputConflictIdentifiedMessage,
                        Code = errorSettings.IncorrectInputConflictIdentifiedCode,
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion

                #region Upadte Matter
                genericResponse = matterProvision.UpdateMatter(matterInformation);
                if (genericResponse == null)
                {
                    var result = new GenericResponseVM()
                    {
                        Code = "200",
                        Value = "Update Success"
                    };
                    return matterCenterServiceFunctions.ServiceResponse(result, (int)HttpStatusCode.OK);
                }
                else
                {
                    if (!genericResponse.IsError)
                    {
                        return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                    }
                    else
                    {
                        return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.NotModified);
                    }
                }

                #endregion

                

            }
            catch (Exception ex)
            {                
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
            
        }

        /// <summary>
        /// This method will delete a given matter and all its associated assets
        /// </summary>
        /// <param name="matterVM"></param>
        /// <returns></returns>
        [HttpPost("deletematter")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("deleteMatter")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will delete a given matter and all its associated assets",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult Delete([FromBody] MatterVM matterVM)
        {
            try
            {
                ErrorResponse errorResponse = null;
                if (null == matterVM && null == matterVM.Client && null == matterVM.Matter && string.IsNullOrWhiteSpace(matterVM.Client.Url) && string.IsNullOrWhiteSpace(matterVM.Matter.Name))
                {
                    errorResponse = new ErrorResponse()
                    {
                        Message = errorSettings.MessageNoInputs,
                        ErrorCode = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed"
                    };
                    return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.BadRequest);
                }

                GenericResponseVM genericResponse = matterProvision.DeleteMatter(matterVM);
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Create a new matter
        /// </summary>
        /// <param name="matterMetdataVM"></param>
        /// <returns></returns>
        [HttpPost("create")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("createMatter")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will create a new matter",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult Create([FromBody] MatterMetdataVM matterMetdataVM)
        {
            
            GenericResponseVM genericResponseVM = null;            
            if (null == matterMetdataVM && null == matterMetdataVM.Client && null == matterMetdataVM.Matter && string.IsNullOrWhiteSpace(matterMetdataVM.Client.Url))
            {
                genericResponseVM = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = $"No input data is passed to create the {errorSettings.Item}",
                    IsError = true
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.BadRequest);
            }
            try
            {
                genericResponseVM = matterProvision.CreateMatter(matterMetdataVM);
                if (genericResponseVM != null && genericResponseVM.IsError == true)
                {
                    //Matter not created successfully
                    genericResponseVM.IsError = true;
                    genericResponseVM.Description = "Matter page not created successfully";
                    
                    return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.OK);
                }
                //Matter page created successfully
                genericResponseVM = new GenericResponseVM
                {
                    Code = HttpStatusCode.OK.ToString(),
                    Value = "Matter page created successfully"
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                matterProvision.DeleteMatter(matterMetdataVM as MatterVM);
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Assigns specified content types to the specified matter (document library).
        /// </summary>
        /// <param name="matterMetadata"></param>
        /// <returns></returns>
        [HttpPost("assigncontenttype")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("assignContenttype")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Assigns specified content types to the specified matter (document library).",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult AssignContentType([FromBody] MatterMetadata matterMetadata)
        {

            GenericResponseVM genericResponse = null;
            if (null == matterMetadata && null == matterMetadata.Client && null == matterMetadata.Matter && 
                matterMetadata.ManagedColumnTerms==null)
            {
                genericResponse = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = $"No input data is passed to assigncontenttype for the {errorSettings.Item}",
                    IsError = true
                };
                
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);               
            }

            // For each value in the list of Content Type Names
            // Add that content Type to the Library
            Matter matter = matterMetadata.Matter;
            Client client = matterMetadata.Client;            

            var matterInformationVM = new MatterInformationVM()
            {
                Client = client,
                Matter = matter,
            };
            try
            {                
                genericResponse = validationFunctions.IsMatterValid(matterInformationVM, int.Parse(ServiceConstants.ProvisionMatterAssignContentType, 
                    CultureInfo.InvariantCulture), null);
                if (genericResponse != null)
                { 
                    matterProvision.DeleteMatter(matterInformationVM as MatterVM);
                    genericResponse.Description = $"Error occurred when asigning content type to the {errorSettings.Item}";

                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                genericResponse = matterProvision.AssignContentType(matterMetadata);
                if (genericResponse != null && genericResponse.IsError==true)
                {
                    matterProvision.DeleteMatter(matterInformationVM as MatterVM);
                    genericResponse.Description = $"Error occurred when asigning content type to the {errorSettings.Item}";

                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                ///// SharePoint Specific Exception
                matterProvision.DeleteMatter(matterInformationVM as MatterVM);
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
                
            }
        }

        /// <summary>
        /// This method will assign user permission to the matter
        /// </summary>
        /// <param name="matterMetadataVM"></param>
        /// <returns></returns>
        [HttpPost("assignuserpermissions")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("assignUserPermissions")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will assign user permission to the matter",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult AssignUserPermissions([FromBody] MatterMetdataVM matterMetadataVM)
        {
            var client = matterMetadataVM.Client;
            var matter = matterMetadataVM.Matter;
            try
            {
                
                var matterConfigurations = matterMetadataVM.MatterConfigurations;
                GenericResponseVM genericResponse = null;
                if (null == client && null == matter && null == client.Url && null == matterConfigurations)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = "No input data is passed",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }

                var genericResponseVM = matterProvision.AssignUserPermissions(matterMetadataVM);
                if (genericResponseVM != null && genericResponseVM.IsError == true)
                {
                    genericResponseVM.IsError = true;
                    return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.BadRequest);
                }
                var assignPermissions = new
                {
                    ReturnValue = true
                };
                return matterCenterServiceFunctions.ServiceResponse(assignPermissions, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                matterProvision.DeleteMatter(matterMetadataVM as MatterVM);
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }


        /// <summary>
        /// Creates matter landing page. If there is any error in creating the landing page, the whole matter will get deleted along with document libraries
        /// </summary>
        /// <param name="matterMetdataVM"></param>
        /// <returns></returns>
        [HttpPost("createlandingpage")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("createLandingPage")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Creates matter landing page. If there is any error in creating the landing page, the whole matter will get deleted along with document libraries",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult CreateLandingPage([FromBody] MatterMetdataVM matterMetdataVM)
        {
            
            
            GenericResponseVM genericResponseVM = null;
            //No valid input
            if (null == matterMetdataVM && null == matterMetdataVM.Client && null == matterMetdataVM.Matter && 
                string.IsNullOrWhiteSpace(matterMetdataVM.Client.Url))
            {
                genericResponseVM = new GenericResponseVM()
                {
                    Value = errorSettings.MessageNoInputs,
                    Code = HttpStatusCode.BadRequest.ToString(),
                    Description = "No input data is passed",
                    IsError = true
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.BadRequest);
            }           
            try
            {
                genericResponseVM = matterProvision.CreateMatterLandingPage(matterMetdataVM);
                if(genericResponseVM!=null)
                {
                    matterProvision.DeleteMatter(matterMetdataVM as MatterVM);
                    //Matter landing page not created successfully
                    genericResponseVM.IsError = true;
                    genericResponseVM.Description = "Matter landing page not created successfully";
                    
                    return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.BadRequest);
                }
                //Matter landing page created successfully
                genericResponseVM = new GenericResponseVM {
                    Code= HttpStatusCode.OK.ToString(),
                    Value="Matter landing page created successfully" 
                };
                return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.OK);
            }
            catch (Exception exception)
            {
                //If there is error in creating matter landing page, delete all the information related to this matter
                matterProvision.DeleteMatter(matterMetdataVM as MatterVM);
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(exception);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Updates matter metadata - Stamps properties to the created matter.
        /// </summary>
        /// <param name="matterMetdata"></param>
        /// <returns></returns>
        [HttpPost("updatemetadata")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("updateMetaData")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Updates matter metadata - Stamps properties to the created matter.",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult UpdateMetadata([FromBody]MatterMetdataVM matterMetdata)
        {
            string editMatterValidation = string.Empty;
            var matter = matterMetdata.Matter;
            var client = matterMetdata.Client;

            try
            {
                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (matterMetdata.Client == null && matterMetdata.Matter == null &&
                    matterMetdata.MatterDetails == null && matterMetdata.MatterProvisionFlags == null && 
                    matterMetdata.MatterDetails.ManagedColumnTerms==null)
                {
                    matterProvision.DeleteMatter(matterMetdata as MatterVM);
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion

                #region Validations
                MatterInformationVM matterInfo = new MatterInformationVM()
                {
                    Client = matterMetdata.Client,
                    Matter = matterMetdata.Matter,
                    MatterDetails = matterMetdata.MatterDetails
                };
                genericResponse = validationFunctions.IsMatterValid(matterInfo,
                    int.Parse(ServiceConstants.ProvisionMatterUpdateMetadataForList),
                    matterMetdata.MatterConfigurations);
                if (genericResponse != null)
                {
                    matterProvision.DeleteMatter(matterMetdata as MatterVM);
                    genericResponse.Description = $"Error occurred while updating the {errorSettings.Item} metadata.";
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion   

                try
                {                   

                    genericResponse = matterProvision.UpdateMatterMetadata(matterMetdata);
                    if (genericResponse == null)
                    {
                        genericResponse = new GenericResponseVM()
                        {
                            Code = "200",
                            Value = "Update Success"
                        };
                        
                    }
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.OK);
                }
                catch (Exception ex)
                {
                    matterProvision.DeleteMatter(matterMetdata as MatterVM);
                    customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                    var errResponse = customLogger.GenerateErrorResponse(ex);
                    return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
                }
            }
            catch (Exception ex)
            {
                matterProvision.DeleteMatter(matterMetdata as MatterVM);
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }

        }

        /// <summary>
        /// This method will allow the matter to be shared with external user
        /// </summary>
        /// <param name="matterInformation"></param>
        /// <returns></returns>
        [HttpPost("sharematter")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("shareMatter")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will allow the matter to be shared with external user",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult ShareMatter([FromBody] MatterInformationVM matterInformation)
        {
            var client = matterInformation.Client;            
            try
            {


                GenericResponseVM genericResponse = null;
                if (matterInformation == null && matterInformation.Client==null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }

                var genericResponseVM = matterProvision.ShareMatterToExternalUser(matterInformation);
                if (genericResponseVM != null && genericResponseVM.IsError == true)
                {
                    genericResponseVM.IsError = true;
                    genericResponseVM.Description = $"Error occurred when sharing {errorSettings.Item} to the External user";
                    return matterCenterServiceFunctions.ServiceResponse(genericResponseVM, (int)HttpStatusCode.BadRequest);
                }
                var assignPermissions = new
                {
                    ReturnValue = true
                };
                return matterCenterServiceFunctions.ServiceResponse(assignPermissions, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {                
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// This method will check whether one note url exists for a selected matter or not
        /// </summary>
        /// <param name="matterInformation"></param>
        /// <returns></returns>
        [HttpPost("onenoteurlexists")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("onenoteurlexists")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will check whether one note url exists for a selected matter or not",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult OneNoteUrlExists([FromBody]MatterInformationVM matterInformation)
        {
            GenericResponseVM genericResponse = null;
            try
            {
                if (matterInformation == null && matterInformation.Client == null && string.IsNullOrWhiteSpace(matterInformation.RequestedUrl))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                bool oneNoteUrlExists = matterRepositoy.OneNoteUrlExists(matterInformation);
                var oneNoteExists = new
                {
                    OneNoteUrlExists = oneNoteUrlExists
                };
                return matterCenterServiceFunctions.ServiceResponse(oneNoteExists, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }            
        }
        #endregion


        /// <summary>
        /// This method will delete the user from the matter document library and its associated lists
        /// and from matter stamped proeprties
        /// </summary>
        /// <param name="matterInformation"></param>
        /// <returns></returns>
        [HttpPost("deleteuserfrommatter")]
        [SwaggerOperation("deleteuserfrommatter")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "Returns IActionResult of type of generic response which says whether the user has been deleted or not")]
         
        public IActionResult DeleteUserFromMatter([FromBody]MatterInformationVM matterInformation)
        {
            string editMatterValidation = string.Empty;
            var matter = matterInformation.Matter;
            var client = matterInformation.Client;
            var userid = matterInformation.UserIds;
            try
            {

                #region Error Checking                
                GenericResponseVM genericResponse = null;
                if (matterInformation.Client == null && matterInformation.Matter == null && matterInformation.MatterDetails == null)
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        Description = $"No input data is passed to update the {errorSettings.Item}",
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }
                #endregion

                #region Validations
                GenericResponseVM validationResponse = null;
                #endregion

                #region Upadte Matter
                genericResponse = matterProvision.DeleteUserFromMatter(matterInformation);
                if (genericResponse == null)
                {
                    var result = new GenericResponseVM()
                    {
                        Code = "200",
                        Value = "Update Success"
                    };
                    return matterCenterServiceFunctions.ServiceResponse(result, (int)HttpStatusCode.OK);
                }
                else
                {
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.NotModified);
                }

                #endregion

            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errorResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errorResponse, (int)HttpStatusCode.InternalServerError);
            }
        }
		
		 /// <summary>
        /// This method will get matter extra field properties and return json object to client.
        /// </summary>
        /// <param name="matterMetadata"></param>
        /// <returns></returns>
        [HttpPost("getmatterprovisionextraproperties")]
        [Produces(typeof(GenericResponseVM))]
        [SwaggerOperation("onenoteurlexists")]
        [SwaggerResponse((int)HttpStatusCode.OK,
            Description = "This method will check whether one note url exists for a selected matter or not",
            Type = typeof(GenericResponseVM))]
         
        public IActionResult GetMatterProvisionExtraProperties([FromBody]MatterMetadata matterMetadata)
        {
            GenericResponseVM genericResponse = null;
            try
            {
                if (matterMetadata == null && matterMetadata.MatterExtraProperties == null &&
                    string.IsNullOrWhiteSpace(matterMetadata.MatterExtraProperties.ContentTypeName))
                {
                    genericResponse = new GenericResponseVM()
                    {
                        Value = errorSettings.MessageNoInputs,
                        Code = HttpStatusCode.BadRequest.ToString(),
                        IsError = true
                    };
                    return matterCenterServiceFunctions.ServiceResponse(genericResponse, (int)HttpStatusCode.BadRequest);
                }

                string matterExtraProperties = matterRepositoy.GetMatterProvisionExtraProperties(matterMetadata.MatterExtraProperties.ContentTypeName, matterMetadata.Client);

                return matterCenterServiceFunctions.ServiceResponse(matterExtraProperties, (int)HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                var errResponse = customLogger.GenerateErrorResponse(ex);
                return matterCenterServiceFunctions.ServiceResponse(errResponse, (int)HttpStatusCode.InternalServerError);
            }
        }

    }
}
