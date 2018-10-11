﻿// ***********************************************************************
// Assembly         : Microsoft.Legal.MatterCenter.ProviderService
// Author           : v-lapedd
// Created          : 04-09-2016
//***************************************************************************
// <copyright file="Search.cs" company="Microsoft">
//     Copyright (c) . All rights reserved.
// </copyright>
// <summary>This file provide methods to perform SharePoint search functionalities</summary>
// ***********************************************************************

using Microsoft.Extensions.Options;
using Microsoft.Legal.MatterCenter.Models;
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.SharePoint.Client;
using Microsoft.SharePoint.Client.Search.Query;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json;
using Microsoft.SharePoint.Client.Utilities;
using Microsoft.SharePoint.ApplicationPages.ClientPickerQuery;
using Microsoft.Extensions.Configuration;

namespace Microsoft.Legal.MatterCenter.Repository
{
    /// <summary>
    /// This class contains all the methods which are related to spo search
    /// </summary>
    public class Search : ISearch
    {
        private GeneralSettings generalSettings;
        private SearchSettings searchSettings;
        private ISPOAuthorization spoAuthorization;
        private ClientContext clientContext;
        private IUsersDetails userDetails;
        private ICustomLogger customLogger;
        private LogTables logTables;
        private ISPList spList;
        private CamlQueries camlQueries;
        private ListNames listNames;
        private SharedSettings sharedSettings;
        private ErrorSettings errorSettings;
        private IConfigurationRoot configuration;
        /// <summary>
        /// 
        /// </summary>
        /// <param name="spoAuthorization"></param>
        /// <param name="generalSettings"></param>
        /// <param name="searchSettings"></param>
        public Search(ISPOAuthorization spoAuthorization,
            IConfigurationRoot configuration,
            ICustomLogger customLogger,
            IUsersDetails userDetails,
            ISPList spList,
            IOptions<GeneralSettings> generalSettings,
            IOptions<SharedSettings> sharedSettings,
            IOptions<LogTables> logTables,
            IOptions<SearchSettings> searchSettings,
            IOptions<CamlQueries> camlQueries,
            IOptions<ListNames> listNames,
            IOptions<ErrorSettings> errorSettings)
        {
            this.spoAuthorization = spoAuthorization;
            this.generalSettings = generalSettings.Value;
            this.searchSettings = searchSettings.Value;
            this.userDetails = userDetails;
            this.customLogger = customLogger;
            this.logTables = logTables.Value;
            this.spList = spList;
            this.camlQueries = camlQueries.Value;
            this.listNames = listNames.Value;
            this.sharedSettings = sharedSettings.Value;
            this.errorSettings = errorSettings.Value;
            this.configuration = configuration;
        }

        #region Public Methods

        /// <summary>
        /// Gets the matters based on search criteria.
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns></returns>
        public SearchResponseVM GetMatters(SearchRequestVM searchRequestVM, ClientContext clientContext)
        {
            SearchResponseVM searchResponseVM = null;
            var client = searchRequestVM.Client;
            var searchObject = searchRequestVM.SearchObject;
            try
            {
                KeywordQuery keywordQuery = new KeywordQuery(clientContext);
                if (string.IsNullOrWhiteSpace(searchObject.SearchTerm))
                {
                    searchObject.SearchTerm = ServiceConstants.ASTERISK;
                }

                if (searchObject.Filters != null)
                {
                    if (searchObject.Filters.FilterByMe == 1)
                    {

                        Users currentUserDetail = userDetails.GetLoggedInUserDetails(clientContext);
                        string userTitle = currentUserDetail.Name;
                        if(generalSettings.IsBackwardCompatible==false)
                        {
                            searchObject.SearchTerm = string.Concat(searchObject.SearchTerm, ServiceConstants.SPACE,
                            ServiceConstants.OPERATOR_AND, ServiceConstants.SPACE,
                            ServiceConstants.OPENING_BRACKET, searchSettings.ManagedPropertyResponsibleAttorney,
                            ServiceConstants.COLON, ServiceConstants.SPACE, ServiceConstants.DOUBLE_QUOTE, userTitle,
                            ServiceConstants.DOUBLE_QUOTE, ServiceConstants.SPACE, ServiceConstants.OPERATOR_AND, ServiceConstants.SPACE,
                            searchSettings.ManagedPropertyTeamMembers, ServiceConstants.COLON, ServiceConstants.SPACE,
                            ServiceConstants.DOUBLE_QUOTE, userTitle,
                            ServiceConstants.DOUBLE_QUOTE, ServiceConstants.SPACE, ServiceConstants.CLOSING_BRACKET);
                        }
                        else
                        {
                            searchObject.SearchTerm = string.Concat(searchObject.SearchTerm,
                                ServiceConstants.SPACE, ServiceConstants.OPERATOR_AND, ServiceConstants.SPACE,
                                ServiceConstants.OPENING_BRACKET, "CPCTeamMembers", ServiceConstants.COLON,
                                ServiceConstants.SPACE, ServiceConstants.DOUBLE_INVERTED_COMMA, userTitle,
                                ServiceConstants.DOUBLE_INVERTED_COMMA, ServiceConstants.SPACE, ServiceConstants.CLOSING_BRACKET);

                        }

                    }

                    keywordQuery = FilterMatters(searchObject, keywordQuery);

                    keywordQuery = KeywordQueryMetrics(client, searchObject, keywordQuery,
                        ServiceConstants.DOCUMENT_LIBRARY_FILTER_CONDITION,
                        searchSettings.ManagedPropertyIsMatter, true);

                    // Create a list of managed properties which are required to be present in search results
                    List<string> managedProperties = new List<string>();
                    managedProperties.Add(searchSettings.ManagedPropertyTitle);
                    managedProperties.Add(searchSettings.ManagedPropertyName);
                    managedProperties.Add(searchSettings.ManagedPropertyDescription);
                    managedProperties.Add(searchSettings.ManagedPropertySiteName);
                    managedProperties.Add(searchSettings.ManagedPropertyLastModifiedTime);
                    var managedColumns = configuration.GetSection("ContentTypes").GetSection("ManagedStampedColumns").GetChildren();
                    foreach (var key in managedColumns)
                    {                       
                            managedProperties.Add(searchSettings.ManagedPropertyExtension + key.Value.Replace("LPC", ""));
                    }
                    managedProperties.Add(searchSettings.ManagedPropertyMatterId);
                    managedProperties.Add(searchSettings.ManagedPropertyCustomTitle);
                    managedProperties.Add(searchSettings.ManagedPropertyPath);
                    managedProperties.Add(searchSettings.ManagedPropertyMatterName);
                    managedProperties.Add(searchSettings.ManagedPropertyOpenDate);
                    managedProperties.Add(searchSettings.ManagedPropertyClientName);
                    managedProperties.Add(searchSettings.ManagedPropertyBlockedUploadUsers);
                    managedProperties.Add(searchSettings.ManagedPropertyResponsibleAttorney);
                    managedProperties.Add(searchSettings.ManagedPropertyClientID);
                    managedProperties.Add(searchSettings.ManagedPropertyMatterGuid);
                    //Adding a new Managed property of defaultMatter content type to be part of search results.
                    managedProperties.Add(searchSettings.ManagedPropertyMatterDefaultContentType);
                  //Filter on Result source to fetch only Matter Center specific results
                  keywordQuery.SourceId = new Guid(searchSettings.SearchResultSourceID);
                    keywordQuery = AssignKeywordQueryValues(keywordQuery, managedProperties);
                    keywordQuery.BypassResultTypes = true;
                    searchResponseVM = FillResultData(clientContext, keywordQuery, searchRequestVM, true, managedProperties);
                }
                return searchResponseVM;
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }

        }

        /// <summary>
        /// Gets the matters based on search criteria.
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns></returns>
        public SearchResponseVM GetDocuments(SearchRequestVM searchRequestVM, ClientContext clientContext)
        {
            SearchResponseVM searchResponseVM = null;
            try
            {
                var client = searchRequestVM.Client;
                var searchObject = searchRequestVM.SearchObject;
                KeywordQuery keywordQuery = new KeywordQuery(clientContext);
                if (string.IsNullOrWhiteSpace(searchObject.SearchTerm))
                {
                    searchObject.SearchTerm = ServiceConstants.ASTERISK;
                }

                if (searchObject.Filters != null)
                {
                    if (searchObject.Filters.FilterByMe == 1)
                    {
                        ////Get logged in user alias
                        Users currentUserDetail = userDetails.GetLoggedInUserDetails(clientContext);
                        string userTitle = currentUserDetail.Name;
                        searchObject.SearchTerm = String.Concat(searchObject.SearchTerm, ServiceConstants.SPACE, ServiceConstants.OPERATOR_AND, ServiceConstants.SPACE, searchSettings.ManagedPropertyAuthor, ServiceConstants.COLON, userTitle);
                    }

                    keywordQuery = FilterDocuments(searchObject, keywordQuery);

                    keywordQuery = KeywordQueryMetrics(client, searchObject, keywordQuery, ServiceConstants.DOCUMENT_ITEM_FILTER_CONDITION,
                        searchSettings.ManagedPropertyIsDocument, false);

                    // Create a list of managed properties which are required to be present in search results
                    List<string> managedProperties = new List<string>();
                    managedProperties.Add(searchSettings.ManagedPropertyFileName);
                    managedProperties.Add(searchSettings.ManagedPropertyTitle);
                    managedProperties.Add(searchSettings.ManagedPropertyCreated);
                    managedProperties.Add(searchSettings.ManagedPropertyUIVersionStringOWSTEXT);
                    managedProperties.Add(searchSettings.ManagedPropertyServerRelativeUrl);
                    managedProperties.Add(searchSettings.ManagedPropertyFileExtension);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentMatterId);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentLastModifiedTime);
                    managedProperties.Add(searchSettings.ManagedPropertySiteTitle);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentClientId);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentClientName);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentMatterName);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentId);
                    managedProperties.Add(searchSettings.ManagedPropertyCheckOutByUser);
                    managedProperties.Add(searchSettings.ManagedPropertySiteName);
                    managedProperties.Add(searchSettings.ManagedPropertySPWebUrl);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentVersion);
                    managedProperties.Add(searchSettings.ManagedPropertyDocumentCheckOutUser);
                    managedProperties.Add(searchSettings.ManagedPropertySPWebUrl);
                    managedProperties.Add(searchSettings.ManagedPropertyAuthor);
                    managedProperties.Add(searchSettings.ManagedPropertyMatterGuid);

                    //Filter on Result source to fetch only Matter Center specific results
                    keywordQuery.SourceId = new Guid(searchSettings.SearchResultSourceID);

                    var managedColumns = configuration.GetSection("ContentTypes").GetSection("ManagedStampedColumns").GetChildren();
                    foreach (var key in managedColumns)
                    {
                        managedProperties.Add(searchSettings.ManagedPropertyExtension + key.Value.Replace("LPC", ""));
                    }
                    //managedProperties.Add("PCPrePodDocumentPracticeGroup");
                    //managedProperties.Add("PCPrePodDocumentProjectType");
                    keywordQuery = AssignKeywordQueryValues(keywordQuery, managedProperties);
                    searchResponseVM = FillResultData(clientContext, keywordQuery, searchRequestVM, false, managedProperties);
                }
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return searchResponseVM;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="client"></param>
        /// <param name="listName"></param>
        /// <param name="listColumnName"></param>
        /// <param name="isShowDocument"></param>
        /// <returns></returns>
        public SearchResponseVM GetPinnedData(SearchRequestVM searchRequestVM, string listName,
            string listColumnName, bool isShowDocument, ClientContext clientContext)
        {
            ////Holds logged-in user alias
            string userAlias = string.Empty;
            ////Object to store all the list items retrieved from SharePoint list
            ListItemCollection listItems;
            ////Stores the JSON structure with the meta-data of pinned matter/document
            string userPinnedDetails = string.Empty;

            SearchResponseVM searchResponse = new SearchResponseVM();
            try
                {
                    ////Get logged in user alias
                    Users currentUserDetail = userDetails.GetLoggedInUserDetails(clientContext);
                    userAlias = currentUserDetail.LogOnName;
                    listItems = spList.GetData(clientContext, listName, string.Format(CultureInfo.InvariantCulture,
                        camlQueries.UserPinnedDetailsQuery, searchSettings.PinnedListColumnUserAlias, userAlias, listColumnName));
                    if (listItems != null && listItems.Count > 0)
                    {
                        ////Since we are maintaining only single list item per user, listItems collection will have only one object; hence accessing first object
                        ////Check if column holds null or empty string. If non empty, pinned matter/document exists
                        if (!string.IsNullOrEmpty(Convert.ToString(listItems[0][listColumnName], CultureInfo.InvariantCulture)))
                        {
                            string userPinnedMatter = Convert.ToString(listItems[0][listColumnName], CultureInfo.InvariantCulture);
                            var sortCol = searchRequestVM.SearchObject.Sort.ByColumn;
                            sortCol = UppercaseFirst(sortCol);

                            if (isShowDocument)
                            {
                                Dictionary<string, DocumentData> userpinnedDocumentCollection =
                                    JsonConvert.DeserializeObject<Dictionary<string, DocumentData>>(userPinnedMatter);
                                searchResponse.TotalRows = userpinnedDocumentCollection.Count;

                                if (searchRequestVM.SearchObject.Sort.SortAndFilterPinnedData == false)
                                {
                                    searchResponse.DocumentDataList = userpinnedDocumentCollection.Values.Reverse();
                                }
                                else
                                {
                                    string lastModifiedDate = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument").GetSection("documentModifiedDate").GetValue<string>("keyName");
                                    string createdDate = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument").GetSection("documentCreatedDate").GetValue<string>("keyName");
                                    //searchResponse.DocumentDataList = userpinnedDocumentCollection.Values.Reverse();

                                    IList<DocumentData> filterPinnedDocList = null;
                                    filterPinnedDocList = GetPinDocsFilteredResult(searchRequestVM, userpinnedDocumentCollection);
                                    filterPinnedDocList = filterPinnedDocList
                                                               .Select(usr => {usr.DocumentMatterName = WebUtility.HtmlDecode(usr.DocumentMatterName);usr.DocumentPracticeGroup = usr.DocumentPracticeGroup;usr.DocumentName = usr.DocumentName;return usr; })
                                                               .ToList();
                                    if (filterPinnedDocList != null)
                                    {
                                        searchResponse.DocumentDataList = filterPinnedDocList;
                                        try
                                        {
                                            if (searchRequestVM.SearchObject.Sort.Direction == 0 && !string.IsNullOrWhiteSpace(sortCol) && filterPinnedDocList.Count > 1)
                                            {
                                                var getSortColNullCount = filterPinnedDocList.Select(x => TypeHelper.GetPropertyValue(x, sortCol)).Where(y => y == null);
                                                if (getSortColNullCount.Count() == 0)
                                                {
                                                    if (sortCol.ToLower().Trim() == lastModifiedDate.ToLower().Trim() || sortCol.ToLower().Trim() == createdDate.ToLower().Trim())
                                                    {
                                                        searchResponse.DocumentDataList = filterPinnedDocList.OrderBy(x => DateTime.Parse(TypeHelper.GetPropertyValue(x, sortCol).ToString())).ToList();
                                                    }
                                                    else
                                                    {
                                                        searchResponse.DocumentDataList = filterPinnedDocList.OrderBy(x => TypeHelper.GetPropertyValue(x, sortCol)).ToList();
                                                    }
                                                }
                                            }
                                            else if (searchRequestVM.SearchObject.Sort.Direction == 1 && !string.IsNullOrWhiteSpace(sortCol) && filterPinnedDocList.Count > 1)
                                            {
                                                var getSortColNullCount = filterPinnedDocList.Select(x => TypeHelper.GetPropertyValue(x, sortCol)).Where(y => y == null);
                                                if (getSortColNullCount.Count() == 0)
                                                {
                                                    if (sortCol.ToLower().Trim() == lastModifiedDate.ToLower().Trim() || sortCol.ToLower().Trim() == createdDate.ToLower().Trim())
                                                    {
                                                        searchResponse.DocumentDataList = filterPinnedDocList.OrderByDescending(x => DateTime.Parse(TypeHelper.GetPropertyValue(x, sortCol).ToString())).ToList();
                                                    }
                                                    else
                                                    {
                                                        searchResponse.DocumentDataList = filterPinnedDocList.OrderByDescending(x => TypeHelper.GetPropertyValue(x, sortCol)).ToList();
                                                    }
                                                }
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            string msg = ex.Message;
                                        }
                                        searchResponse.TotalRows = searchResponse.DocumentDataList.Count;
                                    }
                                    else
                                    {
                                        searchResponse.DocumentDataList = new List<DocumentData>();
                                        searchResponse.TotalRows = 0;
                                    }
                                }
                            }
                            else
                            {
                                Dictionary<string, MatterData> userpinnedMatterCollection =
                                    JsonConvert.DeserializeObject<Dictionary<string, MatterData>>(userPinnedMatter);
                                searchResponse.TotalRows = userpinnedMatterCollection.Count;
                                if (searchRequestVM.SearchObject.Sort.SortAndFilterPinnedData == false)
                                {
                                    searchResponse.MatterDataList = userpinnedMatterCollection.Values.Reverse();
                                }
                                else
                                {
                                    string lastModifiedDate = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter").GetSection("matterModifiedDate").GetValue<string>("keyName");
                                    string createdDate = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter").GetSection("matterCreatedDate").GetValue<string>("keyName");
                                    // searchResponse.MatterDataList = userpinnedMatterCollection.Values.Reverse();


                                    #region Code for filtering pinned data
                                    IList<MatterData> filterPinnedMatterList = null;

                                    filterPinnedMatterList = GetPinMattersFilteredResult(searchRequestVM, userpinnedMatterCollection);
                                    filterPinnedMatterList = filterPinnedMatterList
                                                               .Select(usr => { usr.MatterName = WebUtility.HtmlDecode(usr.MatterName); usr.MatterSubAreaOfLaw = WebUtility.HtmlDecode(usr.MatterSubAreaOfLaw); return usr; })
                                                               .ToList();
                                    if (filterPinnedMatterList != null)
                                    {
                                        searchResponse.MatterDataList = filterPinnedMatterList;
                                        try
                                        {
                                            if (searchRequestVM.SearchObject.Sort.Direction == 0 && !string.IsNullOrWhiteSpace(sortCol) && filterPinnedMatterList.Count > 1)
                                            {
                                                var getSortColNullCount = filterPinnedMatterList.Select(x => TypeHelper.GetPropertyValue(x, sortCol)).Where(y => y == null);
                                                if (getSortColNullCount.Count() == 0)
                                                {
                                                    if (sortCol.ToLower().Trim() == lastModifiedDate.ToLower().Trim() || sortCol.ToLower().Trim() == createdDate.ToLower().Trim())
                                                    {
                                                        searchResponse.MatterDataList = filterPinnedMatterList.OrderBy(x => DateTime.Parse(TypeHelper.GetPropertyValue(x, sortCol).ToString())).ToList();
                                                    }
                                                    else
                                                    {
                                                        searchResponse.MatterDataList = filterPinnedMatterList.OrderBy(x => TypeHelper.GetPropertyValue(x, sortCol)).ToList();
                                                    }
                                                }
                                            }
                                            else if (searchRequestVM.SearchObject.Sort.Direction == 1 && !string.IsNullOrWhiteSpace(sortCol) && filterPinnedMatterList.Count > 1)
                                            {
                                                var getSortColNullCount = filterPinnedMatterList.Select(x => TypeHelper.GetPropertyValue(x, sortCol)).Where(y => y == null);
                                                if (getSortColNullCount.Count() == 0)
                                                {
                                                    if (sortCol.ToLower().Trim() == lastModifiedDate.ToLower().Trim() || sortCol.ToLower().Trim() == createdDate.ToLower().Trim())
                                                    {
                                                        searchResponse.MatterDataList = filterPinnedMatterList.OrderByDescending(x => DateTime.Parse(TypeHelper.GetPropertyValue(x, sortCol).ToString())).ToList();
                                                    }
                                                    else
                                                    {
                                                        searchResponse.MatterDataList = filterPinnedMatterList.OrderByDescending(x => TypeHelper.GetPropertyValue(x, sortCol)).ToList();
                                                    }
                                                }
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            string msg = ex.Message;
                                        }
                                        searchResponse.TotalRows = searchResponse.MatterDataList.Count;
                                    }
                                    else
                                    {
                                        searchResponse.MatterDataList = new List<MatterData>();
                                        searchResponse.TotalRows = 0;
                                    }
                                    #endregion
                                }
                            }
                        }
                    }
                    else
                    {
                        searchResponse.TotalRows = 0;
                        searchResponse.NoPinnedMessage = ServiceConstants.NO_PINNED_MESSAGE;
                    }
                    return searchResponse;
                }
                catch (Exception ex)
                {
                    customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                    throw;
                }
        }

        #region "GetPinnedDocumentFilteredData"

        private IList<DocumentData> GetFilteredPinnedDocumentList(SearchRequestVM searchRequestVM, IList<DocumentData> docList)
        {
            IList<DocumentData> docDataList = docList;
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.ClientName))
            {
                docDataList = (docDataList.Where(d => d.DocumentClient.Equals(searchRequestVM.SearchObject.Filters.ClientName))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.ProjectName))
            {
                docDataList = (docDataList.Where(d => d.DocumentMatterName.Equals(searchRequestVM.SearchObject.Filters.ProjectName))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DocumentAuthor))
            {
                docDataList = (docDataList.Where(d => d.DocumentOwner.Equals(searchRequestVM.SearchObject.Filters.DocumentAuthor))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.PracticeGroup))
            {
                docDataList = (docDataList.Where(d => d.DocumentPracticeGroup.Equals(searchRequestVM.SearchObject.Filters.PracticeGroup))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DocumentCheckoutUsers))
            {
                docDataList = (docDataList.Where(d => d.DocumentCheckoutUser.Equals(searchRequestVM.SearchObject.Filters.DocumentCheckoutUsers))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.Name))
            {
                string docName = searchRequestVM.SearchObject.Filters.Name;
                if (searchRequestVM.SearchObject.Filters.Name.Contains("."))
                {
                    docName = searchRequestVM.SearchObject.Filters.Name.Substring(0, searchRequestVM.SearchObject.Filters.Name.LastIndexOf("."));
                }
                docDataList = (docDataList.Where(d => d.DocumentName.Equals(docName))).ToList();
            }
            if (searchRequestVM.SearchObject.Filters.DateFilters != null)
            {
                if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedFromDate))
                {
                    DateTime fromDate = new DateTime();
                    DateTime toDate = new DateTime();

                    if (DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedFromDate.Replace("Z", ""), out fromDate)
                        && DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedToDate.Replace("Z", ""), out toDate))
                    {
                        docDataList = (docDataList.Where(d => !string.IsNullOrWhiteSpace(d.DocumentModifiedDate)
                        && Convert.ToDateTime(d.DocumentModifiedDate).Date >= fromDate.Date
                        && Convert.ToDateTime(d.DocumentModifiedDate).Date <= toDate.Date)).ToList();
                    }
                }
                if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DateFilters.CreatedFromDate))
                {
                    DateTime fromDate = new DateTime();
                    DateTime toDate = new DateTime();

                    if (DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.CreatedFromDate.Replace("Z", ""), out fromDate)
                        && DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.CreatedToDate.Replace("Z", ""), out toDate))
                    {
                        docDataList = (docDataList.Where(d => !string.IsNullOrWhiteSpace(d.DocumentCreatedDate)
                       && Convert.ToDateTime(d.DocumentCreatedDate).Date >= fromDate.Date
                       && Convert.ToDateTime(d.DocumentCreatedDate).Date <= toDate.Date)).ToList();
                    }
                }
            }
            return docDataList;
        }

        private IList<DocumentData> GetPinDocsFilteredResult(SearchRequestVM searchRequestVM, Dictionary<string, DocumentData> searchResultsVM)
        {
            IList<DocumentData> documentDataList2 = new List<DocumentData>();
            IList<DocumentData> documentDataList = searchResultsVM.Values.ToList();
            string uniqueColumnName = string.Empty;

            documentDataList = GetFilteredPinnedDocumentList(searchRequestVM, searchResultsVM.Values.ToList());

            if (searchRequestVM.SearchObject.UniqueColumnName != null)
            {
                uniqueColumnName = searchRequestVM.SearchObject.UniqueColumnName.ToLower().Trim();
            }
            uniqueColumnName = GetUniqueDocumentColumnName(uniqueColumnName);

            if (string.IsNullOrWhiteSpace(uniqueColumnName))
            {
                return documentDataList;
            }
            else
            {
                var colList = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument");
                if (uniqueColumnName.Equals(colList.GetSection("documentName").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentName.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        foreach (var dt in documentDataList)
                        {
                           dt.DocumentName = dt.DocumentName + "." + dt.DocumentExtension;
                        }
                        var data1 = documentDataList.Select(o => o.DocumentName).Distinct().ToList();

                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentName = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("documentClient").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentClient.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = documentDataList.Select(o => o.DocumentClient).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentClient = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("documentOwner").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentOwner.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = documentDataList.Select(o => o.DocumentOwner).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentOwner = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("documentCheckoutUser").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentCheckoutUser.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = documentDataList.Select(o => o.DocumentCheckoutUser).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentCheckoutUser = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("documentPracticeGroup").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentPracticeGroup.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = documentDataList.Select(o => o.DocumentPracticeGroup).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentPracticeGroup = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("documentMatterName").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        documentDataList = (documentDataList.Where(d => d.DocumentMatterName.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = documentDataList.Select(o => o.DocumentMatterName).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            DocumentData documentData = new DocumentData();
                            documentData.DocumentMatterName = dt;
                            documentDataList2.Add(documentData);
                        }
                    }
                }

                return documentDataList2;
            }
        }

        /// <summary>
        /// to get column name 
        /// </summary>
        /// <returns></returns>
        private string GetUniqueDocumentColumnName(string uniueColumnName)
        {
            var docColumnSesction = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument");

            if (searchSettings.ManagedPropertyDocumentClientName.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentClient").Key;

            }
            else if (searchSettings.ManagedPropertyMatterName.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentMatterName").Key;

            }
            else if (searchSettings.ManagedPropertyAuthor.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentOwner").Key;

            }
            else if (searchSettings.ManagedPropertyPracticeGroup.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentPracticeGroup").Key;

            }
            else if (searchSettings.ManagedPropertyDocumentCheckOutUser.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentCheckoutUser").Key;

            }
            else if (searchSettings.ManagedPropertyFileName.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("documentName").Key;
            }
            else
            {
                uniueColumnName = string.Empty;
            }

            return uniueColumnName;
        }

        #endregion
        #region "GetPinnedMatterFilteredData"

        private IList<MatterData> GetFilteredPinnedMatterList(SearchRequestVM searchRequestVM, IList<MatterData> matterList)
        {
            IList<MatterData> matterDataList = matterList;
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.ClientName))
            {
                matterDataList = (matterDataList.Where(d => d.MatterClient.Equals(searchRequestVM.SearchObject.Filters.ClientName))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.Name))
            {
                matterDataList = (matterDataList.Where(d => d.MatterName.Equals(searchRequestVM.SearchObject.Filters.Name))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.ResponsibleAttorneys))
            {
                matterDataList = (matterDataList.Where(d => d.MatterResponsibleAttorney.Equals(searchRequestVM.SearchObject.Filters.ResponsibleAttorneys))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.PracticeGroup))
            {
                matterDataList = (matterDataList.Where(d => d.MatterPracticeGroup.Equals(searchRequestVM.SearchObject.Filters.PracticeGroup))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.SubareaOfLaw))
            {
                matterDataList = (matterDataList.Where(d => d.MatterSubAreaOfLaw.Equals(searchRequestVM.SearchObject.Filters.SubareaOfLaw))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.AreaOfLaw))
            {
                matterDataList = (matterDataList.Where(d => d.MatterAreaOfLaw.Equals(searchRequestVM.SearchObject.Filters.AreaOfLaw))).ToList();
            }
            if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.ProjectID))
            {
                matterDataList = (matterDataList.Where(d => d.MatterID.Equals(searchRequestVM.SearchObject.Filters.ProjectID))).ToList();
            }
            if (searchRequestVM.SearchObject.Filters.DateFilters != null)
            {
                if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedFromDate))
                {
                    DateTime fromDate = new DateTime();
                    DateTime toDate = new DateTime();

                    if (DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedFromDate.Replace("Z", ""), out fromDate)
                        && DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.ModifiedToDate.Replace("Z", ""), out toDate))
                    {
                        matterDataList = (matterDataList.Where(d => !string.IsNullOrWhiteSpace(d.MatterModifiedDate)
                        && Convert.ToDateTime(d.MatterModifiedDate).Date >= fromDate.Date
                        && Convert.ToDateTime(d.MatterModifiedDate).Date <= toDate.Date)).ToList();
                    }
                }
                if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DateFilters.CreatedFromDate))
                {
                    DateTime fromDate = new DateTime();
                    DateTime toDate = new DateTime();

                    if (DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.CreatedFromDate.Replace("Z", ""), out fromDate)
                        && DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.CreatedToDate.Replace("Z", ""), out toDate))
                    {
                        matterDataList = (matterDataList.Where(d => !string.IsNullOrWhiteSpace(d.MatterCreatedDate)
                       && Convert.ToDateTime(d.MatterCreatedDate).Date >= fromDate.Date
                       && Convert.ToDateTime(d.MatterCreatedDate).Date <= toDate.Date)).ToList();
                    }
                }
                if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.Filters.DateFilters.OpenDateFrom))
                {
                    DateTime fromDate = new DateTime();
                    DateTime toDate = new DateTime();

                    if (DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.OpenDateFrom.Replace("Z", ""), out fromDate)
                        && DateTime.TryParse(searchRequestVM.SearchObject.Filters.DateFilters.OpenDateTo.Replace("Z", ""), out toDate))
                    {
                        matterDataList = (matterDataList.Where(d => !string.IsNullOrWhiteSpace(d.MatterCreatedDate)
                       && Convert.ToDateTime(d.MatterCreatedDate).Date >= fromDate.Date
                       && Convert.ToDateTime(d.MatterCreatedDate).Date <= toDate.Date)).ToList();
                    }
                }
            }
            return matterDataList;
        }


        private IList<MatterData> GetPinMattersFilteredResult(SearchRequestVM searchRequestVM, Dictionary<string, MatterData> searchResultsVM)
        {
            IList<MatterData> matterDataList2 = new List<MatterData>();
            IList<MatterData> matterDataList = searchResultsVM.Values.ToList();
            string uniqueColumnName = string.Empty;

            matterDataList = GetFilteredPinnedMatterList(searchRequestVM, searchResultsVM.Values.ToList());

            if (searchRequestVM.SearchObject.UniqueColumnName != null)
            {
                uniqueColumnName = searchRequestVM.SearchObject.UniqueColumnName.ToLower().Trim();
            }

            uniqueColumnName = GetuniqueMatterColumnName(uniqueColumnName);

            if (string.IsNullOrWhiteSpace(uniqueColumnName))
            {
                return matterDataList;
            }
            else
            {
                var colList = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter");
                if (uniqueColumnName.Equals(colList.GetSection("matterName").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterName.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterName).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterName = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterClient").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterClient.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterClient).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterClient = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterPracticeGroup").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterPracticeGroup.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterPracticeGroup).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterPracticeGroup = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterResponsibleAttorney").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterResponsibleAttorney.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterResponsibleAttorney).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterResponsibleAttorney = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterAreaOfLaw").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterAreaOfLaw.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterAreaOfLaw).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterAreaOfLaw = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterSubAreaOfLaw").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterSubAreaOfLaw.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterSubAreaOfLaw).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterSubAreaOfLaw = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                if (uniqueColumnName.Equals(colList.GetSection("matterID").Key))
                {
                    if (!string.IsNullOrWhiteSpace(searchRequestVM.SearchObject.FilterValue))
                    {
                        matterDataList = (matterDataList.Where(d => d.MatterID.ToLower().Contains(searchRequestVM.SearchObject.FilterValue.ToLower()))).ToList();
                        var data1 = matterDataList.Select(o => o.MatterID).Distinct().ToList();
                        foreach (var dt in data1)
                        {
                            MatterData matterData = new MatterData();
                            matterData.MatterID = dt;
                            matterDataList2.Add(matterData);
                        }
                    }
                }
                return matterDataList2;
            }
        }

        private string GetuniqueMatterColumnName(string uniueColumnName)
        {
            var docColumnSesction = configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter");

            if (searchSettings.ManagedPropertyMatterName.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterName").Key;
            }
            else if (searchSettings.ManagedPropertyClientName.ToString().ToLower().Equals(uniueColumnName) && !generalSettings.IsBackwardCompatible)
            {
                uniueColumnName = docColumnSesction.GetSection("matterClient").Key;
            }
            else if (searchSettings.ManagedPropertyPracticeGroup.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterPracticeGroup").Key;
            }
            else if (searchSettings.ManagedPropertyResponsibleAttorney.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterResponsibleAttorney").Key;
            }
            else if (searchSettings.ManagedPropertyAreaOfLaw.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterAreaOfLaw").Key;
            }
            else if (searchSettings.ManagedPropertySubAreaOfLaw.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterSubAreaOfLaw").Key;
            }
            else if (searchSettings.ManagedPropertyMatterId.ToString().ToLower().Equals(uniueColumnName))
            {
                uniueColumnName = docColumnSesction.GetSection("matterID").Key;
            }
            else
            {
                uniueColumnName = string.Empty;
            }

            return uniueColumnName;
        }

        #endregion

        /// <summary>
        /// Removes pinned item from user pinned details.
        /// </summary>
        /// <param name="requestObject">Request object containing SharePoint App Token</param>
        /// <param name="client">Client object containing Client data</param>
        /// <param name="matterData">Matter object containing Matter data</param>
        /// 
        /// <param name="documentData">Document object containing Document data</param>
        /// <returns>Status of update</returns>
        public bool UnPinMatter(PinRequestMatterVM pinRequestMatterVM)
        {
            try
            {
                clientContext = spoAuthorization.GetClientContext(pinRequestMatterVM.Client.Url);
                return UnPinThisRecord(clientContext, pinRequestMatterVM.Client, pinRequestMatterVM.MatterData, true);
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Add a new pin item to the user pinned matter list
        /// </summary>
        /// <param name="pinRequestMatterVM"></param>
        /// <returns></returns>
        public bool PinMatter(PinRequestMatterVM pinRequestMatterVM)
        {
            try
            {
                using (clientContext = spoAuthorization.GetClientContext(pinRequestMatterVM.Client.Url))
                {
                    return PinThisRecord(clientContext, pinRequestMatterVM.Client, pinRequestMatterVM.MatterData, true);
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }

        }

        /// <summary>
        /// Removes pinned item from user pinned document list.
        /// </summary>
        /// <param name="pinRequestDocumentVM"></param>
        /// <returns></returns>
        public bool UnPinDocument(PinRequestDocumentVM pinRequestDocumentVM)
        {
            try
            {
                using (clientContext = spoAuthorization.GetClientContext(pinRequestDocumentVM.Client.Url))
                {
                    return UnPinThisRecord(clientContext, pinRequestDocumentVM.Client, pinRequestDocumentVM.DocumentData, false);
                }
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Add a new pin document to the user pinned document list
        /// </summary>
        /// <param name="pinRequestDocumentVM"></param>
        /// <returns></returns>
        public bool PinDocument(PinRequestDocumentVM pinRequestDocumentVM)
        {
            try
            {
                using (clientContext = spoAuthorization.GetClientContext(pinRequestDocumentVM.Client.Url))
                {
                    return PinThisRecord(clientContext, pinRequestDocumentVM.Client, pinRequestDocumentVM.DocumentData, false);
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }

        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="client"></param>
        /// <param name="selectedPage"></param>
        /// <param name="listName"></param>
        /// <returns></returns>
        public List<ContextHelpData> GetMatterHelp(Client client, string selectedPage, string listName)
        {
            try
            {
                List<ContextHelpData> contextHelpData = null;
                using (ClientContext clientContext = spoAuthorization.GetClientContext(client.Url))
                {
                    //Object to store all the list items retrieved from SharePoint list
                    ListItemCollection contextualHelpSectionListItems;

                    // Get MatterCenterHelpSection list data
                    contextualHelpSectionListItems = spList.GetData(clientContext, listName,
                        String.Format(CultureInfo.InvariantCulture, camlQueries.RetrieveContextualHelpSectionsQuery, selectedPage));
                    //If these exists any content for contextual help flyout
                    if (null != contextualHelpSectionListItems && 0 < contextualHelpSectionListItems.Count)
                    {
                        contextHelpData = FetchContextualHelpContentUtility(clientContext, contextualHelpSectionListItems);
                    }
                }
                return contextHelpData;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Fetches contextual help content from SPList.
        /// </summary>
        /// <param name="result">String object which stores json object in string format</param>
        /// <param name="selectedSectionIDs">String object which contains selected section id</param>
        /// <param name="sectionID">Collections of section id for contextual help functionality</param>
        /// <param name="contextHelpCollection">Collection of ContextHelpData</param>
        /// <param name="clientContext">ClientContext for SharePoint</param>
        /// <param name="contextualHelpSectionListItems">List collection object for contextual help section list</param>
        /// <returns></returns>
        public List<ContextHelpData> FetchContextualHelpContentUtility(ClientContext clientContext, ListItemCollection contextualHelpSectionListItems)
        {
            try
            {
                string[] contextualHelpLinksQueryParts = camlQueries.ContextualHelpQueryIncludeOrCondition.Split(';');
                IList<string> sectionID = new List<string>();
                string selectedSectionIDs = string.Empty;
                ListItemCollection contextualHelpLinksListItems;
                List<ContextHelpData> contextHelpCollection = new List<ContextHelpData>();
                foreach (ListItem oListItem in contextualHelpSectionListItems)
                {
                    // Retrieve and save content from MatterCenterHelpSectionList
                    sectionID.Add(Convert.ToString(oListItem[sharedSettings.ContextualHelpSectionColumnSectionID], CultureInfo.InvariantCulture));
                }

                // Using section ids, create caml query which will retrieve links from MatterCenterHelpLinksList
                for (int index = 0; index < sectionID.Count; index++)
                {
                    if (index < 2)
                    {
                        selectedSectionIDs = string.Concat(selectedSectionIDs, String.Format(CultureInfo.InvariantCulture, contextualHelpLinksQueryParts[0],
                            sharedSettings.ContextualHelpSectionColumnSectionID, sectionID[index]));
                    }
                    else
                    {
                        selectedSectionIDs = String.Format(CultureInfo.InvariantCulture, contextualHelpLinksQueryParts[1], selectedSectionIDs);
                        selectedSectionIDs = string.Concat(selectedSectionIDs, String.Format(CultureInfo.InvariantCulture, contextualHelpLinksQueryParts[0],
                            sharedSettings.ContextualHelpSectionColumnSectionID, sectionID[index]));
                    }
                }
                if (sectionID.Count > 1)
                {
                    selectedSectionIDs = String.Format(CultureInfo.InvariantCulture, contextualHelpLinksQueryParts[1], selectedSectionIDs);
                }

                // get Contextual Help links form MatterCenterHelpLinksList
                contextualHelpLinksListItems = spList.GetData(clientContext, listNames.MatterCenterHelpLinksListName,
                    String.Format(CultureInfo.InvariantCulture, camlQueries.RetrieveContextualHelpLinksQuery, selectedSectionIDs));
                //If these exists any links for contextual help flyout
                if (null != contextualHelpLinksListItems && 0 < contextualHelpLinksListItems.Count)
                {
                    foreach (ListItem oListItem in contextualHelpLinksListItems)
                    {
                        foreach (ListItem oListItemHelpSection in contextualHelpSectionListItems)
                        {
                            if (Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnSectionID], CultureInfo.InvariantCulture) ==
                                ((Microsoft.SharePoint.Client.FieldLookupValue)(oListItem[sharedSettings.ContextualHelpLinksColumnSectionID])).LookupValue)
                            {
                                string currentLinkOrder = Convert.ToString(oListItem[sharedSettings.ContextualHelpLinksColumnLinkOrder], CultureInfo.InvariantCulture);
                                string currentLinkTitle = Convert.ToString(oListItem[sharedSettings.ContextualHelpLinksColumnLinkTitle], CultureInfo.InvariantCulture);
                                string currentLinkUrl = ((Microsoft.SharePoint.Client.FieldUrlValue)oListItem[sharedSettings.ContextualHelpLinksColumnLinkURL]).Url;
                                string currentPageName = Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnPageName], CultureInfo.InvariantCulture);
                                string numberOfColumns = Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnNumberOfColumns], CultureInfo.InvariantCulture);

                                ContextHelpData contextData = new ContextHelpData
                                {
                                    ContextSection = new ContextHelpSection
                                    {
                                        SectionID = Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnSectionID], CultureInfo.InvariantCulture),
                                        SectionTitle = Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnSectionTitle], CultureInfo.InvariantCulture),
                                        SectionOrder = Convert.ToString(oListItemHelpSection[sharedSettings.ContextualHelpSectionColumnSectionOrder], CultureInfo.InvariantCulture),
                                        PageName = currentPageName,
                                        NumberOfColumns = numberOfColumns
                                    },
                                    LinkOrder = currentLinkOrder,
                                    LinkTitle = currentLinkTitle,
                                    LinkURL = currentLinkUrl
                                };
                                contextHelpCollection.Add(contextData);
                            }
                        }
                    }
                }
                contextHelpCollection = contextHelpCollection.OrderBy(c => c.ContextSection.SectionOrder).ThenBy(c => c.LinkOrder).ToList();
                return contextHelpCollection;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }


        public List<RoleDefinition> GetWebRoleDefinitions(Client client)
        {
            try
            {
                using (ClientContext clientContext = spoAuthorization.GetClientContext(client.Url))
                {
                    Web web = clientContext.Web;
                    clientContext.Load(web.RoleDefinitions, roledefinitions => roledefinitions.Include(thisRole => thisRole.Name, thisRole => thisRole.Id));
                    clientContext.ExecuteQuery();
                    string userAllowedPermissions = searchSettings.UserPermissions;

                    List<RoleDefinition> roleDefinition = new List<RoleDefinition>();
                    if (!String.IsNullOrWhiteSpace(userAllowedPermissions))
                    {
                        //// Get the user permissions from the Resource file
                        List<string> userPermissions = userAllowedPermissions.ToUpperInvariant().Trim().Split(new string[] { ServiceConstants.COMMA }, StringSplitOptions.RemoveEmptyEntries).ToList();
                        //// Filter only the allowed roles using LINQ query
                        roleDefinition = (from webRole in web.RoleDefinitions.ToList()
                                          where userPermissions.Contains(webRole.Name.ToUpperInvariant())
                                          select webRole).ToList();
                    }
                    return roleDefinition;

                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="searchRequestVM"></param>
        /// <returns></returns>
        public IList<PeoplePickerUser> SearchUsers(SearchRequestVM searchRequestVM)
        {
            var client = searchRequestVM.Client;
            var searchObject = searchRequestVM.SearchObject;
            try
            {
                using (ClientContext clientContext = spoAuthorization.GetClientContext(client.Url))
                {

                    ClientPeoplePickerQueryParameters queryParams = new ClientPeoplePickerQueryParameters();
                    queryParams.AllowMultipleEntities = searchSettings.PeoplePickerAllowMultipleEntities;
                    queryParams.MaximumEntitySuggestions = searchSettings.PeoplePickerMaximumEntitySuggestions;
                    queryParams.PrincipalSource = PrincipalSource.All;
                    queryParams.PrincipalType = PrincipalType.User | PrincipalType.SecurityGroup;
                    queryParams.QueryString = searchObject.SearchTerm;
                    int peoplePickerMaxRecords = searchSettings.PeoplePickerMaxRecords;

                    ClientResult<string> clientResult = ClientPeoplePickerWebServiceInterface.ClientPeoplePickerSearchUser(clientContext, queryParams);
                    clientContext.ExecuteQuery();
                    string results = clientResult.Value;
                    IList<PeoplePickerUser> foundUsers = JsonConvert.DeserializeObject<List<PeoplePickerUser>>(results).Where(result => (string.Equals(result.EntityType, ServiceConstants.PEOPLE_PICKER_ENTITY_TYPE_USER,
                        StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(result.Description)) || (!string.Equals(result.EntityType,
                        ServiceConstants.PEOPLE_PICKER_ENTITY_TYPE_USER, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(result.EntityData.Email))).ToList();
                    return foundUsers;
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        public GenericResponseVM GetConfigurations(string siteCollectionUrl, string listName)
        {
            try
            {
                GenericResponseVM genericResponse = null;
                ListItem settingsItem = null;
                using (ClientContext clientContext = spoAuthorization.GetClientContext(siteCollectionUrl))
                {
                    if (spList.CheckPermissionOnList(clientContext, listName, PermissionKind.EditListItems))
                    {
                        string listQuery = string.Format(CultureInfo.InvariantCulture, camlQueries.MatterConfigurationsListQuery,
                            searchSettings.ManagedPropertyTitle, searchSettings.MatterConfigurationTitleValue);
                        settingsItem = spList.GetData(clientContext, listNames.MatterConfigurationsList, listQuery).FirstOrDefault();
                        if (settingsItem != null)
                        {
                            genericResponse = new GenericResponseVM();
                            genericResponse.Code = WebUtility.HtmlDecode(Convert.ToString(settingsItem[searchSettings.MatterConfigurationColumn]));
                            genericResponse.Value = Convert.ToString(settingsItem[searchSettings.ColumnNameModifiedDate], CultureInfo.InvariantCulture);
                            return genericResponse;
                        }
                        else
                        {
                            genericResponse = new GenericResponseVM();
                            genericResponse.Code = "0";
                            genericResponse.Value = string.Empty;
                            return genericResponse;
                        }
                    }
                    else
                    {
                        genericResponse = new GenericResponseVM();
                        genericResponse.Code = errorSettings.UserNotSiteOwnerCode;
                        genericResponse.Value = errorSettings.UserNotSiteOwnerMessage;
                        genericResponse.IsError = true;
                        return genericResponse;
                    }

                }

            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }
        #endregion
        public static class TypeHelper
        {
            public static object GetPropertyValue(object obj, string name)
            {
                return obj == null ? null : obj.GetType()
                                               .GetProperty(name)
                                               .GetValue(obj, null);
            }
        }

        
        #region Private Methods



        /// <summary>
        /// Checks if the requested page exists or not.
        /// </summary>
        /// <param name="requestedUrl">URL of the page, for which check is to be performed</param>
        /// <param name="clientContext">ClientContext for SharePoint</param>
        /// <returns>true or false string based upon the existence of the page, referred in requestedUrl</returns>
        public bool PageExists(Client client, string requestedUrl)
        {
            bool pageExists = false;
            try
            {
                using (ClientContext clientContext = spoAuthorization.GetClientContext(client.Url))
                {
                    if (IsFileExists(clientContext, requestedUrl))
                    {
                        pageExists = true;
                    }
                }
            }            
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return pageExists;
        }


        /// <summary>
        /// Checks the file at the specified location and return the file existence status.
        /// </summary>
        /// <param name="clientContext">Client Context</param>
        /// <param name="pageUrl">File URL</param>
        /// <returns>Success flag</returns>
        public static bool IsFileExists(ClientContext clientContext, string pageUrl)
        {
            bool success = false;
            if (null != clientContext && !string.IsNullOrWhiteSpace(pageUrl))
            {
                File clientFile = clientContext.Web.GetFileByServerRelativeUrl(pageUrl);
                clientContext.Load(clientFile, cf => cf.Exists);
                clientContext.ExecuteQuery();
                success = clientFile.Exists;
            }
            return success;
        }

        private static string UppercaseFirst(string s)
        {
            // Check for empty string.
            if (string.IsNullOrEmpty(s))
            {
                return string.Empty;
            }
            // Return char and concat substring.
            return char.ToUpper(s[0]) + s.Substring(1);
        }

        /// <summary>
        /// Pins the record and associate to logged-in user.
        /// </summary>
        /// <param name="clientContext">The client context object</param>
        /// <param name="getUserPinnedDetails">This is an object that contains the details of the specific pinned matter/document.</param>
        /// <param name="isMatterView">If the user is pinning a matter, this will be true, else will be false.</param>
        /// <returns>It returns a string object, that contains the execution status of the PinThisRecord function.</returns>
        internal bool PinThisRecord(ClientContext clientContext, Client client, object getUserPinnedDetails, bool isMatterView)
        {
            bool status = false;
            if (clientContext != null)
            {
                string userAlias = string.Empty;
                string pinnedDetailsJson = string.Empty;
                ListItemCollection listItems;
                PinUnpinDetails userPinnedDetails = GetCurrentUserPinnedDetails(isMatterView, getUserPinnedDetails);
                try
                {
                    List list = clientContext.Web.Lists.GetByTitle(userPinnedDetails.ListName);
                    Users currentUserDetail = userDetails.GetLoggedInUserDetails(clientContext);
                    userAlias = currentUserDetail.LogOnName;
                    listItems = spList.GetData(clientContext, userPinnedDetails.ListName, string.Format(CultureInfo.InvariantCulture,
                        camlQueries.UserPinnedDetailsQuery,
                        searchSettings.PinnedListColumnUserAlias, userAlias, userPinnedDetails.PinnedListColumnDetails));
                    ////Pinned matter/document(s) exists for users
                    if (null != listItems && 0 < listItems.Count)
                    {
                        ////Logic to create pinned matter/document
                        if (isMatterView)
                        {
                            string userPinnedMatter = !string.IsNullOrEmpty(Convert.ToString(listItems[0][searchSettings.PinnedListColumnMatterDetails],
                                CultureInfo.InvariantCulture)) ? Convert.ToString(listItems[0][searchSettings.PinnedListColumnMatterDetails],
                                CultureInfo.InvariantCulture) : string.Empty;
                            // Check if empty entry is retrieved
                            if (!string.IsNullOrWhiteSpace(userPinnedMatter))
                            {
                                Dictionary<string, MatterData> userpinnedMatterCollection = JsonConvert.DeserializeObject<Dictionary<string, MatterData>>(userPinnedMatter);
                                // Check if matter is already pinned
                                if (!userpinnedMatterCollection.ContainsKey(userPinnedDetails.UserPinnedMatterData.MatterUrl))
                                {
                                    userpinnedMatterCollection.Add(userPinnedDetails.UserPinnedMatterData.MatterUrl, userPinnedDetails.UserPinnedMatterData);
                                    pinnedDetailsJson = JsonConvert.SerializeObject(userpinnedMatterCollection, Newtonsoft.Json.Formatting.Indented);
                                }
                                else
                                {
                                    status = true;
                                }
                            }
                            else
                            {
                                pinnedDetailsJson = GetFirstPinnedMatter(userPinnedDetails);
                            }
                        }
                        else
                        {
                            string userPinnedDocument = !string.IsNullOrEmpty(Convert.ToString(listItems[0][searchSettings.PinnedListColumnDocumentDetails],
                                CultureInfo.InvariantCulture)) ? Convert.ToString(listItems[0][searchSettings.PinnedListColumnDocumentDetails], CultureInfo.InvariantCulture) : string.Empty;
                            if (!string.IsNullOrWhiteSpace(userPinnedDocument))
                            {
                                Dictionary<string, DocumentData> userpinnedDocumentCollection = JsonConvert.DeserializeObject<Dictionary<string, DocumentData>>(userPinnedDocument);
                                // Check if document is already pinned
                                if (!userpinnedDocumentCollection.ContainsKey(userPinnedDetails.URL))
                                {
                                    userpinnedDocumentCollection.Add(userPinnedDetails.URL, userPinnedDetails.UserPinnedDocumentData);
                                    pinnedDetailsJson = JsonConvert.SerializeObject(userpinnedDocumentCollection, Newtonsoft.Json.Formatting.Indented);
                                }
                                else
                                {
                                    status = true;
                                }
                            }
                            else
                            {
                                pinnedDetailsJson = GetFirstPinnedDocument(userPinnedDetails);
                            }
                        }

                        // Run update query only when status is false
                        if (!status)
                        {
                            ////We are maintaining single list item entry for user
                            listItems[0][userPinnedDetails.PinnedListColumnDetails] = pinnedDetailsJson;
                            listItems[0].Update();
                            clientContext.ExecuteQuery();
                            status = true;
                        }
                    }
                    else
                    {
                        ////No pinned matter/document(s) for logged in user. Create pinned matter/document for the user.
                        ////Create pin request
                        if (isMatterView)
                        {
                            pinnedDetailsJson = GetFirstPinnedMatter(userPinnedDetails);
                        }
                        else
                        {
                            pinnedDetailsJson = GetFirstPinnedDocument(userPinnedDetails);
                        }
                        ////Logic to create list item entry for user
                        ListItemCreationInformation listItemInformation = new ListItemCreationInformation();
                        ListItem listItem = list.AddItem(listItemInformation);
                        listItem[searchSettings.PinnedListColumnUserAlias] = userAlias;
                        listItem[userPinnedDetails.PinnedListColumnDetails] = pinnedDetailsJson;
                        listItem.Update();
                        clientContext.ExecuteQuery();
                        listItem.BreakRoleInheritance(false, true);     // Remove inheriting permissions on item
                        clientContext.ExecuteQuery();
                        status = true;
                    }
                    return status;
                }
                catch (Exception exception)
                {
                    customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                    throw;
                }
            }
            return status;
        }

        /// <summary>
        /// Gets the first pinned document serialized JSON object
        /// </summary>        
        /// <param name="userPinnedDetails">User document pin details object</param>
        /// <returns></returns>
        private string GetFirstPinnedDocument(PinUnpinDetails userPinnedDetails)
        {
            try
            {
                Dictionary<string, DocumentData> userFirstPinnedDocument = new Dictionary<string, DocumentData>();
                userFirstPinnedDocument.Add(userPinnedDetails.URL, userPinnedDetails.UserPinnedDocumentData);
                string pinnedDetailsJson = JsonConvert.SerializeObject(userFirstPinnedDocument, Newtonsoft.Json.Formatting.Indented);
                return pinnedDetailsJson;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Gets the first pinned matter serialized JSON object
        /// </summary>
        /// <param name="userPinnedDetails">User matter pin details object</param>
        /// <returns>JSON format of pin data</returns>
        private string GetFirstPinnedMatter(PinUnpinDetails userPinnedDetails)
        {
            try
            {
                Dictionary<string, MatterData> userFirstPinnedMatter = new Dictionary<string, MatterData>();
                userFirstPinnedMatter.Add(userPinnedDetails.UserPinnedMatterData.MatterUrl, userPinnedDetails.UserPinnedMatterData);
                string pinnedDetailsJson = JsonConvert.SerializeObject(userFirstPinnedMatter, Newtonsoft.Json.Formatting.Indented);
                return pinnedDetailsJson;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }

        /// <summary>
        /// Removes the record and dissociate from logged-in user.
        /// </summary>
        /// <param name="clientContext">The client context.</param>
        /// <param name="getUserPinnedDetails">This is an object that contains the details of the specific pinned matter/document.</param>
        /// <param name="isMatterView">If the user is pinning a matter, this will be true, else will be false.</param>
        /// <returns>It returns a string object, that contains the execution status of the function.</returns>
        internal bool UnPinThisRecord(ClientContext clientContext, Client client, object getUserPinnedDetails, bool isMatterView)
        {
            bool status = false;
            if (null != clientContext)
            {
                string userAlias = string.Empty;
                ListItemCollection listItems;
                PinUnpinDetails userPinnedDetails = GetCurrentUserPinnedDetails(isMatterView, getUserPinnedDetails);
                try
                {
                    Users currentUserDetail = userDetails.GetLoggedInUserDetails(clientContext);
                    userAlias = currentUserDetail.LogOnName;
                    listItems = spList.GetData(clientContext, userPinnedDetails.ListName, string.Format(CultureInfo.InvariantCulture,
                        camlQueries.UserPinnedDetailsQuery, searchSettings.PinnedListColumnUserAlias,
                        userAlias, userPinnedDetails.PinnedListColumnDetails));

                    ////Pinned matter/document(s) exists for users
                    if (null != listItems && 0 < listItems.Count)
                    {
                        ////Logic to create pinned matter/document
                        if (isMatterView)
                        {
                            string userPinnedMatter =
                                !string.IsNullOrEmpty(Convert.ToString(listItems[0][userPinnedDetails.PinnedListColumnDetails], CultureInfo.InvariantCulture)) ?
                                Convert.ToString(listItems[0][userPinnedDetails.PinnedListColumnDetails], CultureInfo.InvariantCulture) : string.Empty;
                            Dictionary<string, MatterData> userpinnedMatterCollection = JsonConvert.DeserializeObject<Dictionary<string, MatterData>>(userPinnedMatter);

                            if (!string.IsNullOrWhiteSpace(userPinnedDetails.UserPinnedMatterData.MatterName) &&
                                userpinnedMatterCollection.Where(x => x.Key.ToLower() == WebUtility.HtmlEncode(userPinnedDetails.UserPinnedMatterData.MatterName.Trim().ToLower())).ToList().Count > 0
                                ||
                                !string.IsNullOrWhiteSpace(userPinnedDetails.UserPinnedMatterData.MatterName) &&
                                userpinnedMatterCollection.Where(x => x.Key.ToLower() == userPinnedDetails.UserPinnedMatterData.MatterName.Trim().ToLower()).ToList().Count > 0
                                )
                            {
                                ////Only 1 pinned request for user
                                if (1 == userpinnedMatterCollection.Count)
                                {
                                    ////We are maintaining single list item entry for user
                                    listItems[0].DeleteObject();
                                }
                                else
                                {
                                    ////Matter already exists
                                    userpinnedMatterCollection.Remove(WebUtility.HtmlEncode(userPinnedDetails.UserPinnedMatterData.MatterName));
                                    userpinnedMatterCollection.Remove(userPinnedDetails.UserPinnedMatterData.MatterName);
                                    string updatedMatter = JsonConvert.SerializeObject(userpinnedMatterCollection, Formatting.Indented);
                                    ////We are maintaining single list item entry for user
                                    listItems[0][searchSettings.PinnedListColumnMatterDetails] = updatedMatter;
                                    listItems[0].Update();
                                }
                            }
                        }
                        else
                        {
                            string userPinnedDocument = !string.IsNullOrEmpty(Convert.ToString(listItems[0][userPinnedDetails.PinnedListColumnDetails],
                                CultureInfo.InvariantCulture)) ? Convert.ToString(listItems[0][userPinnedDetails.PinnedListColumnDetails],
                                CultureInfo.InvariantCulture) : string.Empty;
                            Dictionary<string, DocumentData> userpinnedDocumentCollection = new Dictionary<string, DocumentData>(StringComparer.InvariantCultureIgnoreCase);
                            userpinnedDocumentCollection = JsonConvert.DeserializeObject<Dictionary<string, DocumentData>>(userPinnedDocument);
                            if (!string.IsNullOrWhiteSpace(userPinnedDetails.URL) && userpinnedDocumentCollection.Where(x => x.Key.ToLower() == WebUtility.HtmlEncode(userPinnedDetails.URL.Trim().ToLower())).ToList().Count > 0
                                    || !string.IsNullOrWhiteSpace(userPinnedDetails.URL) && userpinnedDocumentCollection.Where(x => x.Key.ToLower() == userPinnedDetails.URL.Trim().ToLower()).ToList().Count>0
                                )
                            {
                                ////Only 1 pinned request for user
                                if (1 == userpinnedDocumentCollection.Count)
                                {
                                    ////We are maintaining single list item entry for user
                                    listItems[0].DeleteObject();
                                }
                                else
                                {
                                    //// Matter already exists
                                    userpinnedDocumentCollection.Remove(WebUtility.HtmlEncode(userPinnedDetails.URL));
                                    userpinnedDocumentCollection.Remove(userPinnedDetails.URL);
                                    string updatedDocument = JsonConvert.SerializeObject(userpinnedDocumentCollection, Newtonsoft.Json.Formatting.Indented);

                                    ////We are maintaining single list item entry for user
                                    listItems[0][userPinnedDetails.PinnedListColumnDetails] = updatedDocument;
                                    listItems[0].Update();
                                }
                            }
                        }

                        clientContext.ExecuteQuery();
                        status = true;
                    }
                    return status;
                }
                catch (Exception exception)
                {
                    customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                    throw;
                }
            }
            return status;
        }

        /// <summary>
        /// Gets the current user pinned details.
        /// </summary>
        /// <param name="isMatterView">If the user is pinning a matter, this will be true, else will be false.</param>
        /// <param name="getUserPinnedDetails">This is an object that contains the details of the specific pinned matter/document.</param>
        /// <returns>This returns an object that contains the details of the specific pinned matter/document.</returns>
        internal PinUnpinDetails GetCurrentUserPinnedDetails(bool isMatterView, object getUserPinnedDetails)
        {
            PinUnpinDetails userPinnedDetails = new PinUnpinDetails();
            try
            {
                if (isMatterView)
                {
                    userPinnedDetails.UserPinnedMatterData = (MatterData)getUserPinnedDetails;
                }
                else
                {
                    userPinnedDetails.UserPinnedDocumentData = (DocumentData)getUserPinnedDetails;
                }

                userPinnedDetails.ListName = isMatterView ? listNames.UserPinnedMatterListName : listNames.UserPinnedDocumentListName;
                userPinnedDetails.PinnedListColumnDetails = isMatterView ? searchSettings.PinnedListColumnMatterDetails : searchSettings.PinnedListColumnDocumentDetails;
                userPinnedDetails.URL = isMatterView ? userPinnedDetails.UserPinnedMatterData.MatterUrl : userPinnedDetails.UserPinnedDocumentData.DocumentUrl;
                return userPinnedDetails;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
        }


        /// <summary>
        /// Returns the query to filter the matters.
        /// </summary>
        /// <param name="searchObject">The search object.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <returns>It returns a keyword query object.</returns>
        private KeywordQuery FilterMatters(SearchObject searchObject, KeywordQuery keywordQuery)
        {
            string filterValues = string.Empty;
            try
            {
                if (null != searchObject && null != keywordQuery)
                {
                    if (null != searchObject.Filters)
                    {
                        if (null != searchObject.Filters.AOLList && 0 < searchObject.Filters.AOLList.Count && !string.IsNullOrWhiteSpace(searchObject.Filters.AOLList[0]))
                        {
                            filterValues = FormFilterQuery(searchSettings.ManagedPropertyAreaOfLaw, searchObject.Filters.AOLList);
                            keywordQuery.RefinementFilters.Add(filterValues);
                        }

                        if (null != searchObject.Filters.PGList && 0 < searchObject.Filters.PGList.Count && !string.IsNullOrWhiteSpace(searchObject.Filters.PGList[0]))
                        {
                            filterValues = FormFilterQuery(searchSettings.ManagedPropertyPracticeGroup, searchObject.Filters.PGList);
                            keywordQuery.RefinementFilters.Add(filterValues);
                        }
                        keywordQuery = AddDateRefinementFilter(keywordQuery, searchObject.Filters.FromDate, searchObject.Filters.ToDate, searchSettings.ManagedPropertyOpenDate);
                        if (null != searchObject.Filters.ClientsList && 0 < searchObject.Filters.ClientsList.Count && !string.IsNullOrWhiteSpace(searchObject.Filters.ClientsList[0]))
                        {
                            filterValues = FormFilterQuery(searchSettings.ManagedPropertyClientName, searchObject.Filters.ClientsList);
                            keywordQuery.RefinementFilters.Add(filterValues);
                        }
                    }

                    keywordQuery = FilterMattersUtility(searchObject, keywordQuery);

                    keywordQuery = FilterCommonDetails(searchObject, keywordQuery, true);
                }
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return keywordQuery;
        }

        /// <summary>
        /// Prepares and returns the query to filter the documents.
        /// </summary>
        /// <param name="searchObject">The search object.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <returns>It returns a Keyword Query object.</returns>
        internal KeywordQuery FilterDocuments(SearchObject searchObject, KeywordQuery keywordQuery)
        {
            string filterValues = string.Empty;
            try
            {
                if (null != searchObject && null != keywordQuery)
                {
                    if (null != searchObject.Filters)
                    {
                        keywordQuery = AddDateRefinementFilter(keywordQuery, searchObject.Filters.FromDate, searchObject.Filters.ToDate, searchSettings.ManagedPropertyCreated);
                        if (null != searchObject.Filters.DocumentAuthor && !string.IsNullOrWhiteSpace(searchObject.Filters.DocumentAuthor))
                        {
                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyAuthor, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.DocumentAuthor, ServiceConstants.DOUBLE_QUOTE));
                        }

                        if (0 < searchObject.Filters.ClientsList.Count && !string.IsNullOrWhiteSpace(searchObject.Filters.ClientsList[0]))
                        {
                            filterValues = FormFilterQuery(searchSettings.ManagedPropertyDocumentClientName, searchObject.Filters.ClientsList);
                            keywordQuery.RefinementFilters.Add(filterValues);
                        }

                        /* New refinement filters for list view control */

                        if (!string.IsNullOrWhiteSpace(searchObject.Filters.Name))
                        {
                            if (searchObject.Filters.Name.Length > 70)
                            {
                                searchObject.Filters.Name = searchObject.Filters.Name.Replace(searchObject.Filters.Name.Substring(70, searchObject.Filters.Name.Length - 70), "*");
                            }

                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyFileName, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.Name, ServiceConstants.DOUBLE_QUOTE));
                        }
                        if (!string.IsNullOrWhiteSpace(searchObject.Filters.ProjectName))
                        {
                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyMatterName, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.ProjectName, ServiceConstants.DOUBLE_QUOTE));
                        }

                        if (!string.IsNullOrWhiteSpace(searchObject.Filters.ClientName))
                        {
                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyDocumentClientName, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.ClientName, ServiceConstants.DOUBLE_QUOTE));
                        }

                        if (null != searchObject.Filters.DocumentCheckoutUsers && !string.IsNullOrWhiteSpace(searchObject.Filters.DocumentCheckoutUsers))
                        {
                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyDocumentCheckOutUser, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.DocumentCheckoutUsers, ServiceConstants.DOUBLE_QUOTE));
                        }
                        if (!string.IsNullOrWhiteSpace(searchObject.Filters.PracticeGroup))
                        {
                            keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyPracticeGroup, ServiceConstants.COLON,
                                ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.PracticeGroup, ServiceConstants.DOUBLE_QUOTE));
                        }
                    }
                    keywordQuery = FilterCommonDetails(searchObject, keywordQuery, false);
                }
            }
            catch (Exception ex)
            {
                customLogger.LogError(ex, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return keywordQuery;
        }

        /// <summary>
        /// Forms filter query for the specified property and data list.
        /// </summary>
        /// <param name="propertyName">Name of the property</param>
        /// <param name="dataList">List of values as data</param>
        /// <returns>Filter query</returns>
        private string FormFilterQuery(string propertyName, IList<string> dataList)
        {
            string previousFilterValues = string.Empty;
            string result = string.Empty;
            try
            {
                if (!string.IsNullOrWhiteSpace(propertyName) && null != dataList)
                {
                    if (1 == dataList.Count)
                    {
                        previousFilterValues = string.Concat(propertyName, ServiceConstants.COLON);
                    }
                    else
                    {
                        previousFilterValues = string.Concat(propertyName, ServiceConstants.COLON, ServiceConstants.SPACE,
                            ServiceConstants.OPENING_BRACKET, ServiceConstants.OPERATOR_OR, ServiceConstants.OPENING_BRACKET);
                    }
                    for (int counter = 0; counter < dataList.Count; counter++)
                    {
                        if (0 < counter)
                        {
                            previousFilterValues += ServiceConstants.COMMA;
                        }
                        previousFilterValues += string.Concat(ServiceConstants.DOUBLE_QUOTE, dataList[counter], ServiceConstants.DOUBLE_QUOTE);
                    }
                    if (1 != dataList.Count)
                    {
                        previousFilterValues += string.Concat(ServiceConstants.CLOSING_BRACKET, ServiceConstants.CLOSING_BRACKET);
                    }
                }
                result = previousFilterValues;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return result;
        }

        /// <summary>
        /// Adds date refinement filter to the keyword query object
        /// </summary>        
        /// <param name="keywordQuery">The keyword query</param>
        /// <param name="fromDate">From date</param>
        /// <param name="toDate">To date</param>
        /// <param name="managedProperty">Managed property name</param>
        /// <returns>Returns a keyword query object</returns>
        private KeywordQuery AddDateRefinementFilter(KeywordQuery keywordQuery, string fromDate, string toDate, string managedProperty)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(fromDate) && !string.IsNullOrWhiteSpace(toDate))
                {
                    keywordQuery.RefinementFilters.Add(string.Concat(managedProperty, ServiceConstants.COLON, ServiceConstants.OPERATOR_RANGE,
                        ServiceConstants.OPENING_BRACKET, fromDate, ServiceConstants.COMMA, toDate, ServiceConstants.CLOSING_BRACKET));
                }
                else if (string.IsNullOrWhiteSpace(fromDate) && !string.IsNullOrWhiteSpace(toDate))
                {
                    keywordQuery.RefinementFilters.Add(string.Concat(managedProperty, ServiceConstants.COLON, ServiceConstants.OPERATOR_RANGE,
                        ServiceConstants.OPENING_BRACKET, ServiceConstants.MIN_DATE, ServiceConstants.COMMA, toDate, ServiceConstants.CLOSING_BRACKET));
                }
                else if (!string.IsNullOrWhiteSpace(fromDate) && string.IsNullOrWhiteSpace(toDate))
                {
                    keywordQuery.RefinementFilters.Add(string.Concat(managedProperty, ServiceConstants.COLON, ServiceConstants.OPERATOR_RANGE,
                        ServiceConstants.OPENING_BRACKET, fromDate, ServiceConstants.COMMA, ServiceConstants.MAX_DATE, ServiceConstants.CLOSING_BRACKET));
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return keywordQuery;
        }

        /// <summary>
        /// Returns the query to filter the matters.
        /// </summary>
        /// <param name="searchObject">The search object.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <returns>It returns a keyword query object.</returns>
        private KeywordQuery FilterMattersUtility(SearchObject searchObject, KeywordQuery keywordQuery)
        {
            try
            {
                if (null != searchObject && null != keywordQuery && null != searchObject.Filters)
                {
                    /* New refinement filters for list view control */
                    if (!string.IsNullOrWhiteSpace(searchObject.Filters.Name))
                    {
                        keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyMatterName, ServiceConstants.COLON,
                            ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.Name, ServiceConstants.DOUBLE_QUOTE));
                    }

                    if (!string.IsNullOrWhiteSpace(searchObject.Filters.ClientName))
                    {
                        keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyClientName, ServiceConstants.COLON,
                            ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.ClientName, ServiceConstants.DOUBLE_QUOTE));
                    }

                    if (null != searchObject.Filters.ResponsibleAttorneys && !string.IsNullOrWhiteSpace(searchObject.Filters.ResponsibleAttorneys))
                    {
                        keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyResponsibleAttorney, ServiceConstants.COLON,
                            ServiceConstants.DOUBLE_QUOTE, searchObject.Filters.ResponsibleAttorneys, ServiceConstants.DOUBLE_QUOTE));
                    }
                    if (null != searchObject.Filters.PracticeGroup && !string.IsNullOrWhiteSpace(searchObject.Filters.PracticeGroup))
                    {
                        var pgList = searchObject.Filters.PracticeGroup.Split(',').ToList();
                        var filterValues = FormFilterQuery(searchSettings.ManagedPropertyPracticeGroup, pgList);
                        keywordQuery.RefinementFilters.Add(filterValues);

                        //keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyPracticeGroup, ServiceConstants.COLON, ServiceConstants.DOUBLE_INVERTED_COMMA, searchObject.Filters.PracticeGroup, ServiceConstants.DOUBLE_INVERTED_COMMA));
                    }
                    if (!string.IsNullOrWhiteSpace(searchObject.Filters.AreaOfLaw))
                    {
                        //keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyAreaOfLaw, ServiceConstants.COLON, ServiceConstants.DOUBLE_INVERTED_COMMA, searchObject.Filters.AreaOfLaw, ServiceConstants.DOUBLE_INVERTED_COMMA));
                        var areaList = searchObject.Filters.AreaOfLaw.Split(',').ToList();
                        var filterValues = FormFilterQuery(searchSettings.ManagedPropertyAreaOfLaw, areaList);
                        keywordQuery.RefinementFilters.Add(filterValues);
                    }

                    if (null != searchObject.Filters.SubareaOfLaw && !string.IsNullOrWhiteSpace(searchObject.Filters.SubareaOfLaw))
                    {
                        var subAreaList = searchObject.Filters.SubareaOfLaw.Split(',').ToList();
                        var filterValues = FormFilterQuery(searchSettings.ManagedPropertySubAreaOfLaw, subAreaList);
                        keywordQuery.RefinementFilters.Add(filterValues);
                        //keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertySubAreaOfLaw, ServiceConstants.COLON, ServiceConstants.DOUBLE_INVERTED_COMMA, searchObject.Filters.SubareaOfLaw, ServiceConstants.DOUBLE_INVERTED_COMMA));
                    }
                    if (null != searchObject.Filters.ProjectID && !string.IsNullOrWhiteSpace(searchObject.Filters.ProjectID))
                    {
                        keywordQuery.RefinementFilters.Add(string.Concat(searchSettings.ManagedPropertyMatterId, ServiceConstants.COLON, ServiceConstants.DOUBLE_INVERTED_COMMA, searchObject.Filters.ProjectID, ServiceConstants.DOUBLE_INVERTED_COMMA));
                    }

                    if (null != searchObject.Filters.DateFilters)
                    {
                        ////// Add refiner for Open date value
                        keywordQuery = AddDateRefinementFilter(keywordQuery, searchObject.Filters.DateFilters.OpenDateFrom,
                            searchObject.Filters.DateFilters.OpenDateTo, searchSettings.ManagedPropertyOpenDate);
                    }

                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }

            return keywordQuery;
        }

        /// <summary>
        /// Returns the query to filter the matters/ documents for common filters.
        /// </summary>
        /// <param name="searchObject">The search object.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <param name="isMatterView">Flag to identify matters/documents view.</param>
        /// <returns>It returns a keyword query object.</returns>
        private KeywordQuery FilterCommonDetails(SearchObject searchObject, KeywordQuery keywordQuery, bool isMatterView)
        {
            try
            {
                if (null != searchObject && null != keywordQuery)
                {

                    if (null != searchObject.Filters.DateFilters)
                    {
                        string lastModifiedTime = searchSettings.ManagedPropertyLastModifiedTime;
                        //// Add refiner for Modified date value
                        if (!isMatterView)
                        {
                            lastModifiedTime = searchSettings.ManagedPropertyDocumentLastModifiedTime;
                        }
                        keywordQuery = AddDateRefinementFilter(keywordQuery, searchObject.Filters.DateFilters.ModifiedFromDate,
                            searchObject.Filters.DateFilters.ModifiedToDate, lastModifiedTime);

                        ////// Add refiner for Created date value
                        keywordQuery = AddDateRefinementFilter(keywordQuery, searchObject.Filters.DateFilters.CreatedFromDate,
                            searchObject.Filters.DateFilters.CreatedToDate, searchSettings.ManagedPropertyCreated);
                    }
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return keywordQuery;
        }

        /// <summary>
        /// Prepares and returns the keyword query to get data from SharePoint Search based on filtering condition.
        /// </summary>
        /// <param name="client">The client object</param>
        /// <param name="searchObject">The search object.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <param name="filterCondition">The filter condition.</param>
        /// <param name="managedProperty">The managed property.</param>
        /// <param name="isMatterView">If the user is pinning a matter, this will be true, else will be false.</param>
        /// <returns>It returns a Keyword Query object.</returns>
        private KeywordQuery KeywordQueryMetrics(Client client, SearchObject searchObject, KeywordQuery keywordQuery,
            string filterCondition, string managedProperty, bool isMatterView)
        {
            KeywordQuery result = null;
            try
            {
                if (generalSettings.IsTenantDeployment)
                {
                    keywordQuery.QueryText = searchObject.SearchTerm;
                }
                else
                {
                    keywordQuery.QueryText = "(" + searchObject.SearchTerm + " AND site:" + client.Url + ")";
                }

                keywordQuery.RefinementFilters.Add(filterCondition);
                if (isMatterView)
                {
                    keywordQuery.RefinementFilters.Add(string.Concat(managedProperty, ServiceConstants.COLON,
                        ServiceConstants.DOUBLE_QUOTE, true, ServiceConstants.DOUBLE_QUOTE));
                }
                else
                {

                    string[] invalidExtensions = searchSettings.FindDocumentInvalidExtensions.Split(',');
                    string chunk = string.Empty;

                    foreach (string extension in invalidExtensions)
                    {
                        chunk = chunk + "equals" + ServiceConstants.OPENING_BRACKET + ServiceConstants.DOUBLE_QUOTE + extension +
                            ServiceConstants.DOUBLE_QUOTE + ServiceConstants.CLOSING_BRACKET + ServiceConstants.COMMA;
                    }
                    chunk = chunk.Remove(chunk.Length - 1);

                    keywordQuery.RefinementFilters.Add(string.Concat("not" + ServiceConstants.OPENING_BRACKET + "FileType", ServiceConstants.COLON, ServiceConstants.OPERATOR_OR + ServiceConstants.OPENING_BRACKET +
                                                                                                            chunk + ServiceConstants.CLOSING_BRACKET + ServiceConstants.CLOSING_BRACKET
                                                                                                            ));
                    keywordQuery.RefinementFilters.Add(string.Concat(managedProperty, ServiceConstants.COLON, "equals", ServiceConstants.OPENING_BRACKET + ServiceConstants.DOUBLE_QUOTE +
                                                                                                            "1" + ServiceConstants.DOUBLE_QUOTE + ServiceConstants.CLOSING_BRACKET
                                                                                                            ));
                }

                keywordQuery.TrimDuplicates = false;
                if (0 < searchObject.PageNumber && 0 < searchObject.ItemsPerPage)
                {
                    keywordQuery.StartRow = (searchObject.PageNumber - 1) * searchObject.ItemsPerPage;
                    keywordQuery.RowLimit = searchObject.ItemsPerPage;
                }

                result = keywordQuery;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return result;
        }

        /// <summary>
        /// Assigns the keyword query values.
        /// </summary>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <param name="managedProperties">The managed properties.</param>
        /// <returns>It returns a Keyword Query object.</returns>
        private KeywordQuery AssignKeywordQueryValues(KeywordQuery keywordQuery, List<string> managedProperties)
        {
            KeywordQuery result = null;
            try
            {
                if (keywordQuery != null)
                {
                    keywordQuery.SelectProperties.Clear();
                    foreach (string selectProperties in managedProperties)
                    {
                        keywordQuery.SelectProperties.Add(selectProperties);
                    }
                    result = keywordQuery;
                }
                else
                {
                    result = null;
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return result;
        }

        /// <summary>
        /// Fires query on SharePoint Search and fills the result data.
        /// </summary>
        /// <param name="clientContext">The client context.</param>
        /// <param name="keywordQuery">The keyword query.</param>
        /// <param name="searchObject">The search object.</param>
        /// <param name="isMatterSearch">The flag to determine weather call is from Search Matter or Search Document.</param>
        /// <param name="managedProperties">List of managed properties</param>
        /// <returns>It returns a string object, that contains all the results combined with dollar pipe dollar separator.</returns>
        private SearchResponseVM FillResultData(ClientContext clientContext, KeywordQuery keywordQuery,
            SearchRequestVM searchRequestVM, Boolean isMatterSearch, List<string> managedProperties)
        {
            SearchResponseVM searchResponseVM = new SearchResponseVM();
            Boolean isReadOnly;
            try
            {
                var searchObject = searchRequestVM.SearchObject;
                //var client = searchRequestVM.Client;
                if (null != searchObject.Sort)
                {
                    keywordQuery.EnableSorting = true;
                    keywordQuery = GetSortByProperty(keywordQuery, searchObject, isMatterSearch);
                }
                if(keywordQuery.QueryText.Length > 4000)
                {
                    return new SearchResponseVM();
                }

                SearchExecutor searchExecutor = new SearchExecutor(clientContext);
                ClientResult<ResultTableCollection> resultsTableCollection = searchExecutor.ExecuteQuery(keywordQuery);
                Users currentLoggedInUser = userDetails.GetLoggedInUserDetails(clientContext);

                if (null != resultsTableCollection && null != resultsTableCollection.Value && 0 <
                    resultsTableCollection.Value.Count && null != resultsTableCollection.Value[0].ResultRows)
                {
                    if (isMatterSearch && 0 < resultsTableCollection.Value.Count &&
                        null != resultsTableCollection.Value[0].ResultRows && !string.IsNullOrWhiteSpace(currentLoggedInUser.Email))
                    {
                        foreach (IDictionary<string, object> matterMetadata in resultsTableCollection.Value[0].ResultRows)
                        {
                            isReadOnly = false;
                            if (null != matterMetadata)
                            {
                                // Decode matter properties
                                DecodeMatterProperties(matterMetadata);
                                string readOnlyUsers = Convert.ToString(matterMetadata[searchSettings.ManagedPropertyBlockedUploadUsers], CultureInfo.InvariantCulture);
                                if (!string.IsNullOrWhiteSpace(readOnlyUsers))
                                {
                                    isReadOnly = IsUserReadOnlyForMatter(isReadOnly, currentLoggedInUser.Name,
                                        currentLoggedInUser.Email, readOnlyUsers);
                                }
                                matterMetadata.Add(generalSettings.IsReadOnlyUser, isReadOnly);
                            }
                        }
                    }
                    else
                    {
                        /*Keeping the code to clean the author values*/
                        foreach (IDictionary<string, object> documentMetadata in resultsTableCollection.Value[0].ResultRows)
                        {
                            if (null != documentMetadata)
                            {
                                string authorData = Convert.ToString(documentMetadata[searchSettings.ManagedPropertyAuthor], CultureInfo.InvariantCulture);
                                int ltIndex = authorData.IndexOf(ServiceConstants.OPENING_ANGULAR_BRACKET, StringComparison.Ordinal);
                                int gtIndex = authorData.IndexOf(ServiceConstants.CLOSING_ANGULAR_BRACKET, StringComparison.Ordinal);
                                authorData = (0 <= ltIndex && ltIndex < gtIndex) ? authorData.Remove(ltIndex, (gtIndex - ltIndex) + 1) : authorData;
                                authorData = authorData.Replace(ServiceConstants.ENCODED_DOUBLE_QUOTES, string.Empty);
                                documentMetadata[searchSettings.ManagedPropertyAuthor] = authorData.Trim();
                            }
                        }
                    }
                    if (resultsTableCollection.Value.Count > 1)
                    {
                        searchResponseVM.TotalRows = resultsTableCollection.Value[0].TotalRows;
                        searchResponseVM.SearchResults = resultsTableCollection.Value[0].ResultRows;
                    }
                    else
                    {
                        if (resultsTableCollection.Value[0].TotalRows == 0)
                        {
                            searchResponseVM = NoDataRow(managedProperties);
                        }
                        else
                        {
                            searchResponseVM.TotalRows = resultsTableCollection.Value[0].TotalRows;
                            searchResponseVM.SearchResults = resultsTableCollection.Value[0].ResultRows;
                        }
                    }
                }
                else
                {
                    searchResponseVM = NoDataRow(managedProperties);
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return searchResponseVM;
        }

        /// <summary>
        /// Defines the sorting property and direction for querying SharePoint Search.
        /// </summary>
        /// <param name="keywordQuery">Keyword object</param>
        /// <param name="searchObject">Search object</param>
        /// <param name="isMatterSearch">Boolean flag which determines current search is for matters or documents</param>
        /// <returns></returns>
        private KeywordQuery GetSortByProperty(KeywordQuery keywordQuery, SearchObject searchObject, Boolean isMatterSearch)
        {
            string matterIDRefiner = string.Empty;
            try
            {
                ////Sorting by specified property  0 --> Ascending order and 1 --> Descending order
                if (!string.IsNullOrWhiteSpace(searchObject.Sort.ByProperty))
                {
                    keywordQuery = AddSortingRefiner(keywordQuery, searchObject.Sort.ByProperty, searchObject.Sort.Direction);
                    //// Add Matter ID property as second level sort for Client.MatterID column based on Search Matter or Search Document
                    if (searchSettings.ManagedPropertyClientID == searchObject.Sort.ByProperty ||
                        searchSettings.ManagedPropertyDocumentClientId == searchObject.Sort.ByProperty)
                    {
                        if (isMatterSearch)
                        {
                            matterIDRefiner = searchSettings.ManagedPropertyMatterId;
                        }
                        else
                        {
                            matterIDRefiner = searchSettings.ManagedPropertyDocumentMatterId;
                        }
                        keywordQuery = AddSortingRefiner(keywordQuery, matterIDRefiner, searchObject.Sort.Direction);
                    }
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return keywordQuery;
        }

        /// <summary>
        /// Decodes matter properties before sending them to UI
        /// </summary>
        /// <param name="matterMetadata">Dictionary object contains matter meta data</param>
        private void DecodeMatterProperties(IDictionary<string, object> matterMetadata)
        {

            // Decode matter properties
            matterMetadata[searchSettings.ManagedPropertyTitle] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyTitle]);
            matterMetadata[searchSettings.ManagedPropertySiteName] = DecodeValues(matterMetadata[searchSettings.ManagedPropertySiteName]);
            matterMetadata[searchSettings.ManagedPropertyDescription] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyDescription]);
            var managedColumns = configuration.GetSection("ContentTypes").GetSection("ManagedStampedColumns").GetChildren();
            foreach (var key in managedColumns)
            {
                if (key.Value.Contains("PracticeGroup"))
                {
                    string practiceGroupKey = key.Value.Replace("LPC", "");
                    matterMetadata[searchSettings.ManagedPropertyExtension + practiceGroupKey] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyExtension + practiceGroupKey]);
                }
                else
                {
                    if(generalSettings.IsBackwardCompatible==false)
                    {
                        matterMetadata[searchSettings.ManagedPropertyExtension + key.Value] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyExtension + key.Value]);
                    }

                }
            }

            matterMetadata[searchSettings.ManagedPropertyCustomTitle] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyCustomTitle]);
            matterMetadata[searchSettings.ManagedPropertyPath] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyPath]);
            matterMetadata[searchSettings.ManagedPropertyMatterName] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyMatterName]);
            matterMetadata[searchSettings.ManagedPropertyOpenDate] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyOpenDate]);
            matterMetadata[searchSettings.ManagedPropertyClientName] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyClientName]);
            matterMetadata[searchSettings.ManagedPropertyBlockedUploadUsers] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyBlockedUploadUsers]);
            matterMetadata[searchSettings.ManagedPropertyResponsibleAttorney] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyResponsibleAttorney]);
            matterMetadata[searchSettings.ManagedPropertyClientID] = DecodeValues(matterMetadata[searchSettings.ManagedPropertyClientID]);
        }

        /// <summary>
        /// Provides the required matter properties
        /// </summary>
        /// <param name="value">Matter Properties object</param>
        /// <returns>Decoded String</returns>
        private static string DecodeValues(object value) => null != value ? WebUtility.HtmlDecode(Convert.ToString(value, CultureInfo.InvariantCulture)) : string.Empty;


        /// <summary>
        /// Checks if logged-in user has read permission on matter.
        /// </summary>
        /// <param name="isReadOnly">Flag indicating if user has read permission on matter</param>
        /// <param name="currentLoggedInUser">Current logged-in user name</param>
        /// <param name="readOnlyUsers">List of read only user for matter</param>
        /// <returns>Flag indicating if user has read permission on matter</returns>
        private bool IsUserReadOnlyForMatter(Boolean isReadOnly, string currentLoggedInUser, string currentLoggedInUserEmail, string readOnlyUsers)
        {
            try
            {
                List<string> readOnlyUsersList = readOnlyUsers.Trim().Split(new string[] { ServiceConstants.SEMICOLON }, StringSplitOptions.RemoveEmptyEntries).ToList();
                List<string> currentReadOnlyUser = (from readOnlyUser in readOnlyUsersList
                                                    where string.Equals(readOnlyUser.Trim(), currentLoggedInUser.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                                    string.Equals(readOnlyUser.Trim(), currentLoggedInUserEmail.Trim(), StringComparison.OrdinalIgnoreCase)
                                                    select readOnlyUser).ToList();
                if (null != currentReadOnlyUser && 0 < currentReadOnlyUser.Count)
                {
                    isReadOnly = true;
                }
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            return isReadOnly;
        }

        /// <summary>
        /// Returns the Keyword query object with refiners added for sorting
        /// </summary>
        /// <param name="keywordQuery">Keyword object</param>
        /// <param name="sortByProperty">Property by which sort is applied</param>
        /// <param name="sortDirection">Direction in which sort is applied (0 --> Ascending order and 1 --> Descending order)</param>
        /// <returns>Keyword object with sorting refiners applied</returns>
        private static KeywordQuery AddSortingRefiner(KeywordQuery keywordQuery, string sortByProperty, int sortDirection)
        {
            if (0 == sortDirection)
            {
                keywordQuery.SortList.Add(sortByProperty, SortDirection.Ascending);
            }
            else if (1 == sortDirection)
            {
                keywordQuery.SortList.Add(sortByProperty, SortDirection.Descending);
            }
            return keywordQuery;
        }

        /// <summary>
        /// Function to return no data row
        /// </summary>
        /// <param name="managedProperties">Managed properties information</param>
        /// <returns>No data row</returns>
        private SearchResponseVM NoDataRow(List<string> managedProperties)
        {
            SearchResponseVM searchResponseVM = new SearchResponseVM();
            try
            {
                List<Dictionary<string, object>> noDataList = new List<Dictionary<string, object>>();
                Dictionary<string, object> noDataObject = new Dictionary<string, object>();
                managedProperties.Add(ServiceConstants.PATH_FIELD_NAME);
                foreach (string managedProperty in managedProperties)
                {
                    if (!noDataObject.ContainsKey(managedProperty))
                    {
                        noDataObject.Add(managedProperty, string.Empty);
                    }
                }

                noDataList.Add(noDataObject);
                searchResponseVM.TotalRows = 0;
                searchResponseVM.SearchResults = noDataList;
            }
            catch (Exception exception)
            {
                customLogger.LogError(exception, MethodBase.GetCurrentMethod().DeclaringType.Name, MethodBase.GetCurrentMethod().Name, logTables.SPOLogTable);
                throw;
            }
            //string result = string.Concat(ServiceConstants.OPEN_SQUARE_BRACE, 
            //    JsonConvert.SerializeObject(noDataObject), ServiceConstants.CLOSE_SQUARE_BRACE,
            //    ServiceConstants.DOLLAR, ServiceConstants.PIPE, ServiceConstants.DOLLAR, 0);
            return searchResponseVM;
        }


        #endregion
    }
}
