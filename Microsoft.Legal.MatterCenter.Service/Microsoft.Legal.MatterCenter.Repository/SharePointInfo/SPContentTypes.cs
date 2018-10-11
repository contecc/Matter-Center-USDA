﻿using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Legal.MatterCenter.Models;
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Taxonomy;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.Legal.MatterCenter.Repository.Extensions;

namespace Microsoft.Legal.MatterCenter.Repository
{
    public class SPContentTypes:ISPContentTypes
    {

        private ContentTypesConfig contentTypesConfig;
        private TaxonomySettings taxonomySettings;
        private ICustomLogger customLogger;
        private LogTables logTables;
        private CamlQueries camlQueries;
        
        private IConfigurationRoot configuration;
        public SPContentTypes(IOptions<ContentTypesConfig> contentTypesConfig, IOptions<CamlQueries> camlQueries,
            ICustomLogger customLogger, IOptions<LogTables> logTables, IOptions<TaxonomySettings> taxonomySettings, IConfigurationRoot configuration
            )
        {
            this.contentTypesConfig = contentTypesConfig.Value;
            this.taxonomySettings = taxonomySettings.Value;
            this.customLogger = customLogger;
            this.logTables = logTables.Value;
            this.camlQueries = camlQueries.Value;            
            this.configuration = configuration;
        }

        /// <summary>
        /// This method will get all content types from the specified content type group and will filter out the content types that user has selected 
        /// when creating the matter
        /// </summary>
        /// <param name="clientContext">The sharepoint context object</param>
        /// <param name="contentTypesNames">Content Type Names that user selected in the create matter screen</param>
        /// <param name="client">The client object which contains information for which client the matter is getting created and the url of the client</param>
        /// <param name="matter">The matter information that is getting created</param>
        /// <returns></returns>
        public IList<ContentType> GetContentTypeData(ClientContext clientContext, IList<string> contentTypesNames, Client client, Matter matter)
        {
            ContentTypeCollection contentTypeCollection = null;
            IList<ContentType> selectedContentTypeCollection = new List<ContentType>();
            try
            {
                if (null != clientContext && null != contentTypesNames)
                {                   

                    Web web = clientContext.Web;
                    string contentTypeName = contentTypesConfig.OneDriveContentTypeGroup.Trim();
                    contentTypeCollection = web.ContentTypes;
                    clientContext.Load(contentTypeCollection, contentType => contentType.Include(thisContentType => thisContentType.Name).Where(currContentType => currContentType.Group == contentTypeName));
                    clientContext.ExecuteQuery();
                    selectedContentTypeCollection = GetContentTypeList(contentTypesNames, contentTypeCollection.ToList());
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }

            return selectedContentTypeCollection;
        }

        /// <summary>
        /// This method will associate content type to the document library. If the content type is not associated
        /// to the document libarary it will associate that content type to that document library
        /// </summary>
        /// <param name="clientContext"></param>
        /// <param name="contentTypeName"></param>
        /// <param name="matterDocumentLibrary"></param>
        public void AssignContentType(ClientContext clientContext, string contentTypeName, List matterDocumentLibrary)
        {
            var contentTypes = matterDocumentLibrary.ContentTypes;
            clientContext.Load(contentTypes);
            clientContext.ExecuteQuery();
            ContentType ct = contentTypes.Where(t => t.Name == contentTypeName).SingleOrDefault();
            if (ct == null)
            {
                ct = clientContext.Web.ContentTypes.GetByName(contentTypeName);
                ct.ReadOnly = false;
                matterDocumentLibrary.ContentTypesEnabled = true;
                matterDocumentLibrary.ContentTypes.AddExistingContentType(ct);
                matterDocumentLibrary.Update();

                clientContext.Load(matterDocumentLibrary,
                    docLib => docLib.ContentTypes,
                    docLib => docLib.RootFolder.UniqueContentTypeOrder);
                clientContext.ExecuteQuery();
                var contentTypeOrder = (from currentCt in matterDocumentLibrary.ContentTypes
                                        where currentCt.Name != contentTypesConfig.HiddenContentType
                                        select currentCt.Id).ToList();
                matterDocumentLibrary.RootFolder.UniqueContentTypeOrder = contentTypeOrder;
                matterDocumentLibrary.RootFolder.Update();
                clientContext.ExecuteQuery();
            }
        }


        /// <summary>
        /// This method will assign content types to the matter that is getting created
        /// </summary>
        /// <param name="matterMetadata"></param>
        /// <param name="clientContext"></param>
        /// <param name="contentTypeCollection"></param>
        /// <param name="client"></param>
        /// <param name="matter"></param>
        /// <returns></returns>
        public GenericResponseVM AssignContentTypeHelper(MatterMetadata matterMetadata, ClientContext clientContext,
            IList<ContentType> contentTypeCollection, Client client, Matter matter)
        {
            try
            {
                Web web = clientContext.Web;
                List matterList = web.Lists.GetByTitle(matter.Name);
                SetFieldValues(clientContext, contentTypeCollection, matterList, matterMetadata);
                clientContext.ExecuteQuery();
                SetDefaultContentType(clientContext, matterList, client, matter);
                string[] viewColumnList = contentTypesConfig.ViewColumnList.Split(new string[] { ServiceConstants.SEMICOLON }, StringSplitOptions.RemoveEmptyEntries).Select(listEntry => listEntry.Trim()).ToArray();
                string strQuery = string.Format(CultureInfo.InvariantCulture, camlQueries.ViewOrderByQuery, contentTypesConfig.ViewOrderByColumn);
                bool isViewCreated = AddView(clientContext, matterList, viewColumnList, contentTypesConfig.ViewName, strQuery);
                return ServiceUtility.GenericResponse(string.Empty, 
                    Convert.ToString(isViewCreated, CultureInfo.CurrentCulture).ToLower(CultureInfo.CurrentCulture));
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, 
                    MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }


        /// <summary>
        ///  Creates a new view for the list
        /// </summary>
        /// <param name="clientContext">Client Context</param>
        /// <param name="matterList">List name</param>
        /// <param name="viewColumnList">Name of the columns in view</param>
        /// <param name="viewName">View name</param>
        /// <param name="strQuery">View query</param>
        /// <returns>String stating success flag</returns>
        public bool AddView(ClientContext clientContext, List matterList, string[] viewColumnList, string viewName, string strQuery)
        {
            bool result = true;
            if (null != clientContext && null != matterList && null != viewColumnList && !string.IsNullOrWhiteSpace(viewName) && !string.IsNullOrWhiteSpace(strQuery))
                try
                {
                    View outlookView = matterList.Views.Add(new ViewCreationInformation
                    {
                        Title = viewName,
                        ViewTypeKind = ViewType.Html,
                        ViewFields = viewColumnList,
                        Paged = true
                    });
                    outlookView.ViewQuery = strQuery;
                    outlookView.Update();
                    clientContext.ExecuteQuery();
                }
                catch (Exception)
                {
                    result = false;
                }
            return result;
        }



        // To get fileds in content type, passed as parameter
        public FieldCollection GetFieldsInContentType(ClientContext clientContext, string conentTypeName)
        {
            try
            {
                // Get the content type using ID: 0x01003D7B5A54BF843D4381F54AB9D229F98A - is the ID of the "Custom" content Type
                ContentType ct = clientContext.Web.ContentTypes.GetByName(conentTypeName);

                // Gets a value that specifies the collection of fields for the content type
                FieldCollection fieldColl = ct.Fields;

                clientContext.Load(fieldColl);
                clientContext.ExecuteQuery();
                return fieldColl;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name,
                    MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        

        /// <summary>
        /// Sets the default content type based on user selection for the new matter that is getting created
        /// </summary>
        /// <param name="clientContext">SP client context</param>
        /// <param name="list">Name of the list</param>
        /// <param name="requestObject">Request Object</param>
        /// <param name="client">Client Object</param>
        /// <param name="matter">Matter Object</param>
        private void SetDefaultContentType(ClientContext clientContext, List list, Client client, Matter matter)
        {
            int contentCount = 0, contentSwap = 0;
            try
            {
                ContentTypeCollection currentContentTypeOrder = list.ContentTypes;
                clientContext.Load(currentContentTypeOrder);
                clientContext.ExecuteQuery();
                IList<ContentTypeId> updatedContentTypeOrder = new List<ContentTypeId>();
                foreach (ContentType contentType in currentContentTypeOrder)
                {
                    if (0 == string.Compare(contentType.Name, matter.DefaultContentType, StringComparison.OrdinalIgnoreCase))
                    {
                        contentSwap = contentCount;
                    }

                    if (0 != string.Compare(contentType.Name, contentTypesConfig.HiddenContentType, StringComparison.OrdinalIgnoreCase))
                    {
                        updatedContentTypeOrder.Add(contentType.Id);
                        contentCount++;
                    }
                }
                if (updatedContentTypeOrder.Count > contentSwap)
                {
                    ContentTypeId documentContentType = updatedContentTypeOrder[0];
                    updatedContentTypeOrder[0] = updatedContentTypeOrder[contentSwap];
                    updatedContentTypeOrder.RemoveAt(contentSwap);
                    updatedContentTypeOrder.Add(documentContentType);
                }
                list.RootFolder.UniqueContentTypeOrder = updatedContentTypeOrder;
                list.RootFolder.Update();
                list.Update();
                clientContext.ExecuteQuery();
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Assigns field values for specified content types to the specified matter (document library).
        /// </summary>
        /// <param name="clientContext">SP client context</param>
        /// <param name="contentTypeCollection">Collection of content types</param>
        /// <param name="matterList">List containing matters</param>
        /// <param name="matterMetadata">Object containing metadata for Matter</param>
        private void SetFieldValues(ClientContext clientContext, IList<ContentType> contentTypeCollection, List matterList, 
            MatterMetadata matterMetadata)
        {
            try
            {
                FieldCollection fields = GetContentType(clientContext, contentTypeCollection, matterList);
                if (null != fields)
                {
                    matterMetadata = GetWSSId(clientContext, matterMetadata, fields);
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientId).DefaultValue = matterMetadata.Client.Id;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientId).SetShowInDisplayForm(true);
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientId).ReadOnlyField = true;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientId).Update();
                    if(configuration.GetSection("General")["IsBackwardCompatible"].ToString().ToLower() == "false")
                    {
                        fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientName).SetShowInDisplayForm(true);
                        fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientName).DefaultValue = matterMetadata.Client.Name;
                        fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientName).ReadOnlyField = true;
                        fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnClientName).Update();
                    }
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterId).DefaultValue = matterMetadata.Matter.Id;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterId).SetShowInDisplayForm(true);
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterId).ReadOnlyField = true;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterId).Update();
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterName).DefaultValue = matterMetadata.Matter.Name;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterName).ReadOnlyField = true;
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterName).SetShowInDisplayForm(true);
                    fields.GetByInternalNameOrTitle(contentTypesConfig.ContentTypeColumnMatterName).Update();

                int levels = taxonomySettings.Levels;
                //For the number of levels that are configured, get the configured column name and 
                //update the wssid, termname and id for the managed field
                for (int i = 1; i <= levels; i++)
                {
                    string columnName = configuration.GetSection("ContentTypes").GetSection("ManagedColumns")["ColumnName" + i];
                    fields.GetByInternalNameOrTitle(columnName).SetShowInDisplayForm(true);
                    ManagedColumn managedColumn = matterMetadata.ManagedColumnTerms[columnName];
                    fields.GetByInternalNameOrTitle(columnName).DefaultValue =
                                string.Format(CultureInfo.InvariantCulture, ServiceConstants.MetadataDefaultValue,
                                managedColumn.WssId,
                                managedColumn.TermName,
                                managedColumn.Id);
                    fields.GetByInternalNameOrTitle(columnName).Update();
                }
                    //To set the values of new content type site columns and update it in sharepoint .
                    //Update the values of site columns of Additional content type at Matter level
                    MatterExtraProperties matterExtraProperties = matterMetadata.MatterExtraProperties; ;

                    foreach (var extraField in matterExtraProperties.Fields)
                    {
                        if (extraField.Type == "Text")
                        {
                            fields.GetByInternalNameOrTitle(extraField.FieldName).DefaultValue = extraField.FieldValue;
                            fields.GetByInternalNameOrTitle(extraField.FieldName).SetShowInDisplayForm(true);
                            fields.GetByInternalNameOrTitle(extraField.FieldName).Update();
                        }
                        else
                        {
                            fields.GetByInternalNameOrTitle(extraField.FieldName).DefaultValue = extraField.FieldValue;
                            fields.GetByInternalNameOrTitle(extraField.FieldName).Update();
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name,
                    MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Function to get the WssID for all the managed columns that user has configured
        /// </summary>
        /// <param name="clientContext">SP client context</param>
        /// <param name="matterMetadata">Object containing meta data for Matter</param>
        /// <param name="fields">Field Collection object</param>
        /// <returns>An Object containing meta data for Matter</returns>
        private MatterMetadata GetWSSId(ClientContext clientContext, MatterMetadata matterMetadata, FieldCollection fields)
        {
            try
            {
                int levels = taxonomySettings.Levels;
                //For the number of levels that are configured, get the configured column name for each level and get the wssid and 
                //update the ManagedColumnTerms object with wssid
                for (int i = 1; i <= levels; i++)
                {
                    string columnName = configuration.GetSection("ContentTypes").GetSection("ManagedColumns")["ColumnName" + i];
                    ClientResult<TaxonomyFieldValue> managedColumnWSSId = clientContext.CastTo<TaxonomyField>
                    (fields.GetByInternalNameOrTitle(columnName))
                    .GetFieldValueAsTaxonomyFieldValue(matterMetadata.ManagedColumnTerms[columnName].Id);
                    clientContext.ExecuteQuery();
                    matterMetadata.ManagedColumnTerms[columnName].WssId = managedColumnWSSId.Value.WssId;
                }
                return matterMetadata;
            }
            catch(Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw ex;
            }
        }

        /// <summary>
        /// Retrieves the list of content types that are to be associated with the matter.
        /// </summary>
        /// <param name="clientContext">SP client context</param>
        /// <param name="contentTypeCollection">Collection of content types</param>
        /// <param name="matterList">List containing matters</param>
        /// <returns>Content types in Field Collection object</returns>
        private static FieldCollection GetContentType(ClientContext clientContext, IList<ContentType> contentTypeCollection, List matterList)
        {
            foreach (ContentType contenttype in contentTypeCollection)
            {
                matterList.ContentTypesEnabled = true;
                matterList.ContentTypes.AddExistingContentType(contenttype);
            }

            matterList.Update();
            FieldCollection fields = matterList.Fields;
            clientContext.Load(fields);
            clientContext.Load(matterList);
            clientContext.ExecuteQuery();
            return fields;
        }

        /// <summary>
        /// Generates the list of Content Types that are associated with matter.
        /// </summary>
        /// <param name="contentTypesNames">List of Content Type names that user has selected</param>
        /// <param name="contentTypeList">Content Types listed in Content Type hub under Matter Center group</param>
        /// <returns>List of Content Types associated with matter</returns>
        private static IList<ContentType> GetContentTypeList(IList<string> contentTypesNames, List<ContentType> contentTypeList)
        {
            IList<ContentType> selectedContentTypeCollection = new List<ContentType>();
            ContentType selectedContentType = null;
            foreach (string contentTypeName in contentTypesNames)
            {
                selectedContentType = (from currContentType in contentTypeList
                                       where currContentType.Name.ToUpperInvariant().Equals(contentTypeName.ToUpperInvariant())
                                       select currContentType).ToList().FirstOrDefault();
                if (null != selectedContentType)
                {
                    selectedContentTypeCollection.Add(selectedContentType);
                }
            }
            return selectedContentTypeCollection;
        }
    }
}
