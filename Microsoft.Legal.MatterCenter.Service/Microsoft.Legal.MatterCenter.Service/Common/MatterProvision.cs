﻿using Microsoft.Extensions.OptionsModel;
using Microsoft.Legal.MatterCenter.Models;
using Microsoft.Legal.MatterCenter.Repository;
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.SharePoint.Client;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;

namespace Microsoft.Legal.MatterCenter.Service
{
    public class MatterProvision:IMatterProvision
    {
        private MatterSettings matterSettings;
        private IMatterRepository matterRepositoy;
        private ISPOAuthorization spoAuthorization;
        private IEditFunctions editFunctions;
        private ErrorSettings errorSettings;
        private ICustomLogger customLogger;
        private LogTables logTables;
        private MailSettings  mailSettings;
        private ValidationFunctions validationFunctions;
        public MatterProvision(IMatterRepository matterRepositoy, IOptions<MatterSettings> matterSettings, IOptions<ErrorSettings> errorSettings,
            ISPOAuthorization spoAuthorization, IEditFunctions editFunctions, ValidationFunctions validationFunctions,
            ICustomLogger customLogger, IOptions<LogTables> logTables, IOptions<MailSettings> mailSettings)
        {
            this.matterRepositoy = matterRepositoy;
            this.matterSettings = matterSettings.Value;
            this.spoAuthorization = spoAuthorization;
            this.editFunctions = editFunctions;
            this.errorSettings = errorSettings.Value;
            this.customLogger = customLogger;
            this.logTables = logTables.Value;
            this.validationFunctions = validationFunctions;
            this.mailSettings = mailSettings.Value;
        }


        public GenericResponseVM UpdateMatter(MatterInformationVM matterInformation)
        {
            var matter = matterInformation.Matter;
            var matterDetails = matterInformation.MatterDetails;
            var client = matterInformation.Client;
            int listItemId = -1;
            string loggedInUserName = "";
            bool isEditMode = matterInformation.EditMode;
            ClientContext clientContext = null;
            IEnumerable<RoleAssignment> userPermissionOnLibrary = null;
            GenericResponseVM genericResponse = null;
            try
            {                
                clientContext = spoAuthorization.GetClientContext(matterInformation.Client.Url);
                PropertyValues matterStampedProperties = matterRepositoy.GetStampedProperties(clientContext, matter.Name);
                loggedInUserName = matterRepositoy.GetLoggedInUserDetails(clientContext).Name;
                bool isFullControlPresent = editFunctions.ValidateFullControlPermission(matter);
                
                if (!isFullControlPresent)
                {
                    return ServiceUtility.GenericResponse(errorSettings.IncorrectInputSelfPermissionRemoval, errorSettings.ErrorEditMatterMandatoryPermission);
                }               
                
                // Get matter library current permissions
                userPermissionOnLibrary = matterRepositoy.FetchUserPermissionForLibrary(clientContext, matter.Name);
                string originalMatterName = matterRepositoy.GetMatterName(clientContext, matter.Name);
                listItemId = matterRepositoy.RetrieveItemId(clientContext, matterSettings.MatterLandingPageRepositoryName, originalMatterName);
                List<string> usersToRemove = RetrieveMatterUsers(userPermissionOnLibrary);
                bool hasFullPermission = CheckFullPermissionInAssignList(matter.AssignUserNames, matter.Permissions, loggedInUserName);
                List<string> listExists = matterRepositoy.MatterAssociatedLists(clientContext, matter.Name);
                matterRepositoy.AssignRemoveFullControl(clientContext, matter, loggedInUserName, listItemId, listExists, true, hasFullPermission);
                bool result = false;
                if (listExists.Contains(matter.Name))
                {
                    result = matterRepositoy.UpdatePermission(clientContext, matter, usersToRemove, loggedInUserName, false, matter.Name, -1, isEditMode);
                }
                if (listExists.Contains(matter.Name + matterSettings.OneNoteLibrarySuffix))
                {
                    result = matterRepositoy.UpdatePermission(clientContext, matter, usersToRemove, loggedInUserName, false, matter.Name + matterSettings.OneNoteLibrarySuffix, -1, isEditMode);
                }
                if (listExists.Contains(matter.Name + matterSettings.CalendarNameSuffix))
                {
                    result = matterRepositoy.UpdatePermission(clientContext, matter, usersToRemove, loggedInUserName, false, matter.Name + matterSettings.CalendarNameSuffix, -1, isEditMode);
                }
                if (listExists.Contains(matter.Name + matterSettings.TaskNameSuffix))
                {
                    result = matterRepositoy.UpdatePermission(clientContext, matter, usersToRemove, loggedInUserName, false, matter.Name + matterSettings.TaskNameSuffix, -1, isEditMode);
                }
                if (0 <= listItemId)
                {
                    result = matterRepositoy.UpdatePermission(clientContext, matter, usersToRemove, loggedInUserName, true, matterSettings.MatterLandingPageRepositoryName, listItemId, isEditMode);
                }
                // Update matter metadata
                result = matterRepositoy.UpdateMatterStampedProperties(clientContext, matterDetails, matter, matterStampedProperties, isEditMode);
                if(result)
                {
                    return genericResponse;
                }
            }
            catch(Exception ex)
            {
                MatterRevertList matterRevertListObject = new MatterRevertList()
                {
                    MatterLibrary = matter.Name,
                    MatterOneNoteLibrary = matter.Name + matterSettings.OneNoteLibrarySuffix,
                    MatterCalendar = matter.Name + matterSettings.CalendarNameSuffix,
                    MatterTask = matter.Name + matterSettings.TaskNameSuffix,
                    MatterSitePages = matterSettings.MatterLandingPageRepositoryName
                };
                matterRepositoy.RevertMatterUpdates(client, matter, clientContext, matterRevertListObject, loggedInUserName, 
                    userPermissionOnLibrary, listItemId, isEditMode);                
            }
            return ServiceUtility.GenericResponse("9999999", "Error in updating matter information");
        }


        public GenericResponseVM CreateMatter()
        {
            return null;
        }

        public GenericResponseVM UpdateMatterMetadata(MatterMetdataVM matterMetadata)
        {
            var matter = matterMetadata.Matter;
            var matterDetails = matterMetadata.MatterDetails;
            var client = matterMetadata.Client;
            ClientContext clientContext = null;
            GenericResponseVM returnFlag = null;
            try
            {
                clientContext = spoAuthorization.GetClientContext(matterMetadata.Client.Url);
                PropertyValues matterStampedProperties = matterRepositoy.GetStampedProperties(clientContext, matter.Name);
                Dictionary<string, string> propertyList = SetStampProperty(client, matter, matterDetails);
                matterRepositoy.SetPropertBagValuesForList(clientContext, matterStampedProperties, matter.Name, propertyList);
                if (matterMetadata.MatterProvisionFlags.SendEmailFlag)
                {
                    returnFlag = ShareMatter(matterMetadata, matterMetadata.MatterProvisionFlags.MatterLandingFlag);
                }
                else
                {
                    ServiceUtility.GenericResponse("", "Matter Update Success");
                }
            }
            catch(Exception ex)
            {
                DeleteMatter(client, matter);
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return returnFlag;
        }

        public GenericResponseVM DeleteMatter(Client client, Matter matter)
        {
            GenericResponseVM genericResponse =   matterRepositoy.DeleteMatter(client, matter);
            return genericResponse;
        }

        #region private functions

        /// <summary>
        /// Creates an item in the specific list with the list of users to whom the matter will be shared.
        /// </summary>
        /// <param name="requestObject">Request Object containing SharePoint App Token</param>
        /// <param name="client">Client object containing Client data</param>
        /// <param name="matter">Matter object containing Matter data</param>
        /// <returns>true if success else false</returns>
        /// /// <summary>
        internal GenericResponseVM ShareMatter(MatterMetdataVM matterMetadata, string matterLandingFlag)
        {
            GenericResponseVM returnFlag = null;
            var matter = matterMetadata.Matter;
            var matterDetails = matterMetadata.MatterDetails;
            var client = matterMetadata.Client;
            var matterConfigurations = matterMetadata.MatterConfigurations;
            if (null != client && null != matter && null != matterDetails)
            {
                try
                {
                    Uri mailListURL = new Uri(string.Format(CultureInfo.InvariantCulture, "{0}{1}{2}{3}{4}", matterSettings.ProvisionMatterAppURL, 
                        ServiceConstants.FORWARD_SLASH, ServiceConstants.LISTS, ServiceConstants.FORWARD_SLASH, matterSettings.SendMailListName));
                    string centralMailListURL = Convert.ToString(mailListURL, CultureInfo.InvariantCulture);
                    string mailSiteURL = centralMailListURL.Substring(0, centralMailListURL.LastIndexOf(string.Concat(ServiceConstants.FORWARD_SLASH,
                        ServiceConstants.LISTS, ServiceConstants.FORWARD_SLASH), StringComparison.OrdinalIgnoreCase));
                    ///// Retrieve the specific site where the Mail List is present along with the required List Name
                    if (null != mailListURL && null != client.Url)
                    {
                        if (!string.IsNullOrWhiteSpace(mailSiteURL))
                        {
                            returnFlag = ShareMatterUtility(client, matter, matterDetails, 
                                mailSiteURL, centralMailListURL, matterLandingFlag, matterConfigurations);
                        }
                    }
                }
                catch (Exception ex)
                {
                    customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                    throw;
                }
            }
            return returnFlag;
        }

        /// <summary>
        /// Function to share the matter.
        /// </summary>
        /// <param name="requestObject">Request Object containing SharePoint App Token</param>
        /// <param name="client">Client object containing Client data</param>
        /// <param name="matter">Matter object containing Matter data</param>
        /// <param name="subAreaOfLawList">String contains all sub area of law</param>
        /// <param name="mailListURL">URL contains list of mail recipients</param>
        /// <returns>Result of operation: Matter Shared successfully or not</returns>        
        internal GenericResponseVM  ShareMatterUtility(Client client, Matter matter, MatterDetails matterDetails, string mailSiteURL, string centralMailListURL, string matterLandingFlag, MatterConfigurations matterConfigurations)
        {
            bool shareFlag = false;
            string mailListName = centralMailListURL.Substring(centralMailListURL.LastIndexOf(ServiceConstants.FORWARD_SLASH, StringComparison.OrdinalIgnoreCase) + 1);
            string matterLocation = string.Concat(client.Url, ServiceConstants.FORWARD_SLASH, matter.Name);
            string ProvisionMatterValidation = string.Empty;
            GenericResponseVM genericResponse = null;
            if (!string.IsNullOrWhiteSpace(mailSiteURL))
            {
                using (ClientContext clientContext = spoAuthorization.GetClientContext(mailSiteURL))
                {
                    
                    genericResponse = validationFunctions.MatterDetailsValidation(matter, client, 
                        int.Parse(ServiceConstants.ProvisionMatterShareMatter, CultureInfo.InvariantCulture), matterConfigurations);
                    if(genericResponse!=null)
                    {
                        return genericResponse;
                    }
                    
                    // Get the current logged in User
                    clientContext.Load(clientContext.Web.CurrentUser);
                    clientContext.ExecuteQuery();
                    string matterMailBody, blockUserNames;
                    // Generate Mail Subject
                    string matterMailSubject = string.Format(CultureInfo.InvariantCulture, mailSettings.MatterMailSubject, 
                        matter.Id, matter.Name, clientContext.Web.CurrentUser.Title);

                    // Logic to Create Mail body
                    // Step 1: Create Matter Information
                    // Step 2: Create Team Information
                    // Step 3: Create Access Information
                    // Step 4: Create Conflict check Information based on the conflict check flag and create mail body

                    // Step 1: Create Matter Information
                    string defaultContentType = string.Format(CultureInfo.InvariantCulture, 
                        mailSettings.MatterMailDefaultContentTypeHtmlChunk, matter.DefaultContentType);
                    string matterType = string.Join(";", matter.ContentTypes.ToArray()).TrimEnd(';').Replace(matter.DefaultContentType, defaultContentType);

                    // Step 2: Create Team Information
                    string secureMatter = ServiceConstants.FALSE.ToUpperInvariant() == matter.Conflict.SecureMatter.ToUpperInvariant() ?
                        ServiceConstants.NO : ServiceConstants.YES;
                    string mailBodyTeamInformation = string.Empty;
                    mailBodyTeamInformation = TeamMembersPermissionInformation(matterDetails, mailBodyTeamInformation);

                    // Step 3: Create Access Information
                    if (ServiceConstants.TRUE == matterLandingFlag)
                    {
                        matterLocation = string.Concat(client.Url, ServiceConstants.FORWARD_SLASH, 
                            matterSettings.MatterLandingPageRepositoryName.Replace(ServiceConstants.SPACE, string.Empty), 
                            ServiceConstants.FORWARD_SLASH, matter.MatterGuid, ServiceConstants.ASPX_EXTENSION);
                    }
                    string oneNotePath = string.Concat(client.Url, ServiceConstants.FORWARD_SLASH, 
                        matter.MatterGuid, matterSettings.OneNoteLibrarySuffix, 
                        ServiceConstants.FORWARD_SLASH, matter.MatterGuid, ServiceConstants.FORWARD_SLASH, matter.MatterGuid);

                    // Step 4: Create Conflict check Information based on the conflict check flag and create mail body
                    if (matterConfigurations.IsConflictCheck)
                    {
                        string conflictIdentified = ServiceConstants.FALSE.ToUpperInvariant() == matter.Conflict.Identified.ToUpperInvariant() ?
                        ServiceConstants.NO : ServiceConstants.YES;
                        blockUserNames = string.Join(";", matter.BlockUserNames.ToArray()).Trim().TrimEnd(';');

                        blockUserNames = !String.IsNullOrEmpty(blockUserNames) ? string.Format(CultureInfo.InvariantCulture, 
                            "<div>{0}: {1}</div>", "Conflicted User", blockUserNames) : string.Empty;
                        matterMailBody = string.Format(CultureInfo.InvariantCulture, 
                            mailSettings.MatterMailBodyMatterInformation, client.Name, client.Id, 
                            matter.Name, matter.Id, matter.Description, matterType) + string.Format(CultureInfo.InvariantCulture, 
                            mailSettings.MatterMailBodyConflictCheck, ServiceConstants.YES, matter.Conflict.CheckBy, 
                            Convert.ToDateTime(matter.Conflict.CheckOn, CultureInfo.InvariantCulture).ToString(matterSettings.MatterCenterDateFormat, CultureInfo.InvariantCulture), 
                            conflictIdentified) + string.Format(CultureInfo.InvariantCulture, 
                            mailSettings.MatterMailBodyTeamMembers, secureMatter, mailBodyTeamInformation, 
                            blockUserNames, client.Url, oneNotePath, matter.Name, matterLocation, matter.Name);
                    }
                    else
                    {
                        blockUserNames = string.Empty;
                        matterMailBody = string.Format(CultureInfo.InvariantCulture, mailSettings.MatterMailBodyMatterInformation, 
                            client.Name, client.Id, matter.Name, matter.Id, 
                            matter.Description, matterType) + string.Format(CultureInfo.InvariantCulture, mailSettings.MatterMailBodyTeamMembers, secureMatter, 
                            mailBodyTeamInformation, blockUserNames, client.Url, oneNotePath, matter.Name, matterLocation, matter.Name);
                    }

                    Web web = clientContext.Web;
                    List mailList = web.Lists.GetByTitle(mailListName);
                    List<FieldUserValue> userList = new List<FieldUserValue>();
                    List<FieldUserValue> userEmailList = GenerateMailList(matter, new Client {Url = mailSiteURL }, ref userList);
                    ///// Add the Matter URL in list
                    FieldUrlValue matterPath = new FieldUrlValue()
                    {
                        Url = string.Concat(client.Url.Replace(String.Concat(ServiceConstants.HTTPS, ServiceConstants.COLON, 
                        ServiceConstants.FORWARD_SLASH, ServiceConstants.FORWARD_SLASH), String.Concat(ServiceConstants.HTTP, ServiceConstants.COLON, 
                        ServiceConstants.FORWARD_SLASH, ServiceConstants.FORWARD_SLASH)), ServiceConstants.FORWARD_SLASH, matter.Name, 
                        ServiceConstants.FORWARD_SLASH, matter.Name),
                        Description = matter.Name
                    };
                    List<string> columnNames = new List<string>() { matterSettings.ShareListColumnMatterPath, matterSettings.ShareListColumnMailList,
                        mailSettings.ShareListColumnMailBody, mailSettings.ShareListColumnMailSubject };
                    List<object> columnValues = new List<object>() { matterPath, userEmailList, matterMailBody, matterMailSubject };
                    // To avoid the invalid symbol error while parsing the JSON, return the response in lower case 
                    matterRepositoy.AddItem(clientContext, mailList, columnNames, columnValues);
                    
                }
            }
            return genericResponse;
        }


        /// <summary>
        /// Generates list of users for sending email.
        /// </summary>
        /// <param name="matter">Matter details</param>
        /// <param name="clientContext">SharePoint client context</param>
        /// <param name="userList">List of users associated with the matter</param>
        /// <returns>List of users to whom mail is to be sent</returns>
        internal List<FieldUserValue> GenerateMailList(Matter matter, Client client, ref List<FieldUserValue> userList)
        {
            List<FieldUserValue> result = null;
            try
            {
                List<FieldUserValue> userEmailList = new List<FieldUserValue>();
                if (null != matter.AssignUserNames)
                {
                    foreach (IList<string> userNames in matter.AssignUserNames)
                    {
                        userList = matterRepositoy.ResolveUserNames(client, userNames).ToList();
                        foreach (FieldUserValue userEmail in userList)
                        {
                            userEmailList.Add(userEmail);
                        }
                    }
                }
                result = userEmailList;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return result;
        }

        /// <summary>
        /// Provides the team members and their respective permission details.
        /// </summary>
        /// <param name="matterDetails">Matter Details object</param>
        /// <param name="mailBodyTeamInformation">Team members permission information</param>
        /// <returns>Team members permission information</returns>
        private static string TeamMembersPermissionInformation(MatterDetails matterDetails, string mailBodyTeamInformation)
        {
            if (null != matterDetails && !string.IsNullOrWhiteSpace(matterDetails.RoleInformation))
            {
                Dictionary<string, string> roleInformation = JsonConvert.DeserializeObject<Dictionary<string, string>>(matterDetails.RoleInformation);

                foreach (KeyValuePair<string, string> entry in roleInformation)
                {
                    mailBodyTeamInformation = string.Format(CultureInfo.InvariantCulture, ServiceConstants.RoleInfoHtmlChunk, entry.Key, entry.Value) + 
                        mailBodyTeamInformation;
                }
            }
            return mailBodyTeamInformation;
        }

        /// <summary>
        /// Function to create dictionary object for stamp property 
        /// </summary>
        /// <param name="client">Client object containing Client data</param>
        /// <param name="matter">Matter object containing Matter data</param>
        /// <param name="matterDetails">Matter details object which has data of properties to be stamped</param>
        /// <returns>returns dictionary object</returns>
        internal Dictionary<string, string> SetStampProperty(Client client, Matter matter, MatterDetails matterDetails)
        {
            string matterCenterPermission = string.Join(ServiceConstants.DOLLAR + ServiceConstants.PIPE + ServiceConstants.DOLLAR, matter.Permissions);
            string matterCenterRoles = string.Join(ServiceConstants.DOLLAR + ServiceConstants.PIPE + ServiceConstants.DOLLAR, matter.Roles);
            string documentTemplateCount = string.Join(ServiceConstants.DOLLAR + ServiceConstants.PIPE + ServiceConstants.DOLLAR, matter.DocumentTemplateCount);
            string matterCenterUsers = string.Empty;
            string separator = string.Empty;
            foreach (IList<string> userNames in matter.AssignUserNames)
            {
                matterCenterUsers += separator + string.Join(ServiceConstants.SEMICOLON, userNames.Where(user => !string.IsNullOrWhiteSpace(user)));
                separator = ServiceConstants.DOLLAR + ServiceConstants.PIPE + ServiceConstants.DOLLAR;
            }
            List<string> keys = new List<string>();
            Dictionary<string, string> propertyList = new Dictionary<string, string>();
            keys.Add(matterSettings.StampedPropertyPracticeGroup);
            keys.Add(matterSettings.StampedPropertyAreaOfLaw);
            keys.Add(matterSettings.StampedPropertySubAreaOfLaw);
            keys.Add(matterSettings.StampedPropertyMatterName);
            keys.Add(matterSettings.StampedPropertyMatterID);
            keys.Add(matterSettings.StampedPropertyClientName);
            keys.Add(matterSettings.StampedPropertyClientID);
            keys.Add(matterSettings.StampedPropertyResponsibleAttorney);
            keys.Add(matterSettings.StampedPropertyTeamMembers);
            keys.Add(matterSettings.StampedPropertyIsMatter);
            keys.Add(matterSettings.StampedPropertyOpenDate);
            keys.Add(matterSettings.StampedPropertySecureMatter);
            keys.Add(matterSettings.StampedPropertyBlockedUploadUsers);
            keys.Add(matterSettings.StampedPropertyMatterDescription);
            keys.Add(matterSettings.StampedPropertyConflictCheckDate);
            keys.Add(matterSettings.StampedPropertyConflictCheckBy);
            keys.Add(matterSettings.StampedPropertyMatterCenterRoles);
            keys.Add(matterSettings.StampedPropertyMatterCenterPermissions);
            keys.Add(matterSettings.StampedPropertyMatterCenterUsers);
            keys.Add(matterSettings.StampedPropertyDefaultContentType);
            keys.Add(matterSettings.StampedPropertyIsConflictIdentified);
            keys.Add(matterSettings.StampedPropertyDocumentTemplateCount);
            keys.Add(matterSettings.StampedPropertyBlockedUsers);
            keys.Add(matterSettings.StampedPropertyMatterGUID);

            propertyList.Add(matterSettings.StampedPropertyPracticeGroup, WebUtility.HtmlEncode(matterDetails.PracticeGroup));
            propertyList.Add(matterSettings.StampedPropertyAreaOfLaw, WebUtility.HtmlEncode(matterDetails.AreaOfLaw));
            propertyList.Add(matterSettings.StampedPropertySubAreaOfLaw, WebUtility.HtmlEncode(matterDetails.SubareaOfLaw));
            propertyList.Add(matterSettings.StampedPropertyMatterName, WebUtility.HtmlEncode(matter.Name));
            propertyList.Add(matterSettings.StampedPropertyMatterID, WebUtility.HtmlEncode(matter.Id));
            propertyList.Add(matterSettings.StampedPropertyClientName, WebUtility.HtmlEncode(client.Name));
            propertyList.Add(matterSettings.StampedPropertyClientID, WebUtility.HtmlEncode(client.Id));
            propertyList.Add(matterSettings.StampedPropertyResponsibleAttorney, WebUtility.HtmlEncode(matterDetails.ResponsibleAttorney));
            propertyList.Add(matterSettings.StampedPropertyTeamMembers, WebUtility.HtmlEncode(matterDetails.TeamMembers));
            propertyList.Add(matterSettings.StampedPropertyIsMatter, ServiceConstants.TRUE);
            propertyList.Add(matterSettings.StampedPropertyOpenDate, WebUtility.HtmlEncode(DateTime.Now.ToString(matterSettings.ValidDateFormat, CultureInfo.InvariantCulture)));
            propertyList.Add(matterSettings.PropertyNameVtiIndexedPropertyKeys, WebUtility.HtmlEncode(ServiceUtility.GetEncodedValueForSearchIndexProperty(keys)));
            propertyList.Add(matterSettings.StampedPropertySecureMatter, (matter.Conflict != null) ? (matter.Conflict.SecureMatter != null) ? WebUtility.HtmlEncode(matter.Conflict.SecureMatter) : "False" : "False");
            propertyList.Add(matterSettings.StampedPropertyBlockedUploadUsers, WebUtility.HtmlEncode(string.Join(";", matterDetails.UploadBlockedUsers)));
            propertyList.Add(matterSettings.StampedPropertyMatterDescription, WebUtility.HtmlEncode(matter.Description));
            propertyList.Add(matterSettings.StampedPropertyConflictCheckDate, (string.IsNullOrEmpty(matter.Conflict.CheckOn)) ? 
                "" : WebUtility.HtmlEncode(Convert.ToDateTime(matter.Conflict.CheckOn, CultureInfo.InvariantCulture).ToString(matterSettings.ValidDateFormat, CultureInfo.InvariantCulture)));
            propertyList.Add(matterSettings.StampedPropertyConflictCheckBy, WebUtility.HtmlEncode(matter.Conflict.CheckBy));
            propertyList.Add(matterSettings.StampedPropertyMatterCenterRoles, WebUtility.HtmlEncode(matterCenterRoles));
            propertyList.Add(matterSettings.StampedPropertyMatterCenterPermissions, WebUtility.HtmlEncode(matterCenterPermission));
            propertyList.Add(matterSettings.StampedPropertyMatterCenterUsers, WebUtility.HtmlEncode(matterCenterUsers));
            propertyList.Add(matterSettings.StampedPropertyDefaultContentType, WebUtility.HtmlEncode(matter.DefaultContentType));
            propertyList.Add(matterSettings.StampedPropertyIsConflictIdentified, WebUtility.HtmlEncode(matter.Conflict.Identified));
            propertyList.Add(matterSettings.StampedPropertyDocumentTemplateCount, WebUtility.HtmlEncode(documentTemplateCount));
            propertyList.Add(matterSettings.StampedPropertyBlockedUsers, WebUtility.HtmlEncode(string.Join(";", matter.BlockUserNames)));
            propertyList.Add(matterSettings.StampedPropertyMatterGUID, WebUtility.HtmlEncode(matter.MatterGuid));
            propertyList.Add(matterSettings.StampedPropertySuccess, ServiceConstants.TRUE);
            return propertyList;
        }

        /// <summary>
        /// Gets the display name of users having permission on library.
        /// </summary>
        /// <param name="userPermissionOnLibrary">Users having permission on library</param>
        /// <returns></returns>
        internal List<string> RetrieveMatterUsers(IEnumerable<RoleAssignment> userPermissionOnLibrary)
        {
            List<string> users = new List<string>();
            try
            {
                if (null != userPermissionOnLibrary && 0 < userPermissionOnLibrary.Count())
                {
                    foreach (RoleAssignment roles in userPermissionOnLibrary)
                    {
                        users.Add(roles.Member.Title);
                    }
                }
            }
            catch (Exception)
            {
                throw;
            }
            return users;
        }

        /// <summary>
        /// Check Full Permission for logged in User.
        /// </summary>
        /// <param name="AssignUserNames">List of Assigned UserNames</param>
        /// <param name="Permissions">List of Permission</param>
        /// <param name="loggedInUserName">Name of logged in User</param>
        /// <returns>Status of Full Permission</returns>
        internal bool CheckFullPermissionInAssignList(IList<IList<string>> AssignUserNames, IList<string> Permissions, string loggedInUserName)
        {
            bool result = false;
            if (null != Permissions && null != AssignUserNames && Permissions.Count == AssignUserNames.Count)
            {
                int position = 0;
                foreach (string roleName in Permissions)
                {
                    IList<string> assignUserNames = AssignUserNames[position];
                    if (!string.IsNullOrWhiteSpace(roleName) && null != assignUserNames)
                    {
                        foreach (string user in assignUserNames)
                        {
                            if (!string.IsNullOrWhiteSpace(user) && user.Trim().Equals(loggedInUserName.Trim()))
                            {
                                if (roleName == matterSettings.EditMatterAllowedPermissionLevel)
                                {
                                    return true;
                                }
                            }
                        }
                    }
                    position++;
                }
                return result;
            }
            return result;
        }
        #endregion
    }
}
