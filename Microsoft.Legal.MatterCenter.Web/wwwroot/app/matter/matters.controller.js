(function () {
    'use strict';

    var app = angular.module("matterMain");

    app.controller('mattersController', ['$scope', '$state', '$interval', '$stateParams', 'api', '$timeout', 'matterResource', '$rootScope', 'uiGridConstants', '$location', '$http', '$window', '$parse', '$templateCache', '$q', '$filter', 'commonFunctions', '$animate', 'adalAuthenticationService',
        function ($scope, $state, $interval, $stateParams, api, $timeout, matterResource, $rootScope, uiGridConstants, $location, $http, $window, $parse, $templateCache, $q, $filter, commonFunctions, $animate, adalService) {
            //#region For declaring variables.
            var vm = this;
            vm.selected = '';
            vm.selectedRow = {
                matterClientUrl: '',
                matterName: '',
                matterGuid: ''
            };
            //#region Variables for dynamic contents
            vm.navigationContent = uiconfigs.Navigation;
            vm.configSearchContent = configs.search;

            vm.matterConfigContent = uiconfigs.Matters;
            vm.uploadMessages = uiconfigs.uploadMessages;
            vm.configsUri = configs.uri;
            vm.globalSettings = configs.global;
            vm.header = uiconfigs.Header;
            vm.center = configs.search.Schema.toLowerCase();
            vm.previousMatterNameValue = '';
            vm.previousClientNameValue = '';
            vm.previousPracticeGroupValue = '';
            vm.previousResponsibleAttorneyValue = '';
            vm.previousSubAreaOfLawValue = '';
            vm.previousAreaOfLawValue = '';
            vm.previousMatterIdValue = '';
            //#region Setting the dynamic width to grid
            var screenHeight = 0;
            vm.searchResultsLength = 0;
            //#endregion
            vm.mattername = "" + vm.matterConfigContent.Dropdown1Item2 + "";
            vm.sortname = "";
            vm.mattersdrop = false;
            vm.mattersdropinner = true;
            $rootScope.bodyclass = "bodymain";
            $rootScope.profileClass = "";
            $rootScope.displayOverflow = "";
            vm.hideUpload = true;
            //This value is for displaying the help
            $rootScope.pageIndex = "1";
            //To load the Contextual help data
            $rootScope.help();
            //#region Onload show ui grid and hide error div
            //start
            vm.divuigrid = true;
            //vm.nodata = false;
            vm.dropDownMenu = false;
            vm.dropDownMenuLoader = true;
            vm.urlExists = false;
            vm.filternodata = false;
            vm.matterid = 2;
            vm.matterExtraFields = [];
            vm.sortby = "desc";
            vm.sortexp = "matterModifiedDate";
            //#endregion

            //#region To hide lazyloader on load
            vm.lazyloader = true;
            vm.lazyloaderFilter = true;
            //#endregion

            //#region Scopes for displaying and hiding filter icons           
            vm.matterfilter = false;
            vm.moddatefilter = false;
            vm.opendatefilter = false;
            vm.clientfilter = false;
            vm.areafilter = false;
            vm.areaoflawfilter = false;
            vm.subareafilter = false;
            vm.attorneyfilter = false;
            vm.practiceGroupfilter = false;
            vm.projectIDfilter = false;
            vm.showfiltericon = vm.configSearchContent.ManagedPropertyLastModifiedTime;
            //#endregion

            //#region Assigning scopes for Dropdowns in headers
            vm.matterDropDowm = false;
            vm.clientDropDowm = false;
            vm.modifieddateDropDowm = false;
            vm.attorneyDropDowm = false;
            vm.arealawDropDowm = false;
            vm.subArealawDropDowm = false;
            vm.practiceGroupDropDown = false;
            vm.projectIDDropDown = false;
            vm.opendateDropDown = false;
            //#endregion

            //#endregion Declaring Variables.

            Office.initialize = function (reason) {
            };
            $scope.initOfficeLibrary = function () {
            };

            //#region For setting the dynamic width to grid
            vm.setWidth = function () {
                var width = $window.innerWidth;
                angular.element(".ui-grid-viewport").css('max-width', width);
                angular.element(".ui-grid-render-container").css('max-width', width);
                screenHeight = $window.screen.availHeight;
                if (screenHeight <= 768) {
                    vm.searchResultsLength = 20;
                } else if (screenHeight <= 1024 && screenHeight >= 769) {
                    vm.searchResultsLength = 45;
                } else if (screenHeight <= 1080 && screenHeight >= 1025) {
                    vm.searchResultsLength = 55;
                }
            };
            vm.setWidth();
            //#endregion

            //#region For clearing all sorts 
            vm.clearAllFiltersofSort = function () {
                angular.element('[id^="asc"]').hide();
                angular.element('[id^="desc"]').hide();
                vm.MatterNameSort = undefined;
                vm.ClientSort = undefined;
                vm.ClientIDSort = undefined;
                vm.ModiFiedTimeSort = undefined;
                vm.ResAttoSort = undefined;
                vm.SubAreaSort = undefined;
                vm.OpenDateSort = undefined;
            }
            //#endregion
            //#region to get the taxonomy term data

            //input parameters building here for all the api's
            var optionsForPracticeGroup = {
                Client: {

                    Url: configs.global.repositoryUrl
                },
                TermStoreDetails: {
                    TermGroup: configs.taxonomy.termGroup,
                    TermSetName: configs.taxonomy.practiceGroupTermSetName,
                    CustomPropertyName: configs.taxonomy.subAreaOfLawCustomContentTypeProperty,
                    DocumentTemplatesName: configs.taxonomy.subAreaOfLawDocumentContentTypeProperty,
                }
            }
            // api call to get the complete taxonomy term store data
            function getTaxonomyDetailsForPractice(optionsForPracticeGroup, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getTaxonomyDetails',
                    data: optionsForPracticeGroup,
                    success: callback
                });
            }
            vm.taxonomyData = {};
           
            //#end region
            //#region For setting dynamic height to the grid
            vm.getTableHeight = function () {
                return {
                    height: ($window.innerHeight - 95) + "px"
                };
            };
            //#endregion

            vm.ariaMessage = function(message){
                jQuery.a11yfy.assertiveAnnounce(message);
            }

            //#region To get the column header name
            vm.switchFuction = function (columnName) {
                var displayColumn = [];
                switch (columnName) {
                    case "GridColumn1Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn1Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn1HeaderTitle;
                        break;
                    case "GridColumn2Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn2Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn2HeaderTitle;
                        break;
                    case "GridColumn3Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn3Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn3HeaderTitle;
                        break;
                    case "GridColumn4Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn4Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn4HeaderTitle;
                        break;
                    case "GridColumn5Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn5Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn5HeaderTitle;
                        break;
                    case "GridColumn6Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn6Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn6HeaderTitle;
                        break;
                    case "GridColumn7Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn7Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn7HeaderTitle;
                        break;
                    case "GridColumn8Header":
                        displayColumn[0] = vm.matterConfigContent.GridColumn8Header;
                        displayColumn[1] = vm.matterConfigContent.GridColumn8HeaderTitle;
                        break;
                    default:
                        displayColumn = '';
                        displayColumn[1] = '';
                        break;
                }
                return displayColumn;
            };
            //#endregion

            $templateCache.put('coldefheadertemplate.html', "<div><div  aria-label='{{ col.colDef.displayName }}'  class='ui-grid-cell-contents ui-grid-header-cell-primary-focus' col-index='renderIndex'><span class='ui-grid-header-cell-label ng-binding' tabindex='0' ng-focus='grid.appScope.vm.ariaMessage(\"Click to sort by \" ) '  title='Column name'>{{ col.colDef.displayName }}<span id='asc{{col.colDef.field}}' style='float:right;display:none' class='padl10px'>↑</span><span id='desc{{col.colDef.field}}' style='float:right;display:none' class='padlf10'>↓</span></span></div></div>");

            //#region To get the column schema and populate in column collection for grid with sorting of column display
            //Declaring column collection object.
            // Collection requires as columns defination will be read through appsettings files and - 
            // - number of columns is dynemic (not fixed) and reduced code redundancy and easy to read and understand.
            var columnDefs1 = [];
            angular.forEach(configs.search.searchColumnsUIPickerForMatter, function (value, key) {
                if (value.displayInUI == true && value.position != -1) {
                    var displaycolVal = vm.switchFuction(value.displayName);
                    columnDefs1.push({
                        field: value.keyName,
                        displayName: displaycolVal[0],
                        width: value.width,
                        enableHiding: value.enableHiding,
                        cellTemplate: value.cellTemplate,
                        headerCellTemplate: value.headerCellTemplate == "Custom" ? $templateCache.get('coldefheadertemplate.html').replace('Click to sort by', displaycolVal[1]).replace('Column name', displaycolVal[1]) : value.headerCellTemplate,
                        position: value.position,
                        cellClass: value.cellClass,
                        headerCellClass: value.headerCellClass,
                        visible: value.defaultVisibleInGrid,
                        suppressRemoveSort: true
                    });
                }
            });

            //Sorting the column as per appsetting columns defination.
            function getSortFunction(fieldName) {
                return function (col1, col2) {
                    return parseInt(col1[fieldName]) - parseInt(col2[fieldName]);
                }
            }
            columnDefs1.sort(getSortFunction("position"));

            //#endregion

            //#region Setting the options for grid and declaration of grid object
            vm.gridOptions = {
                infiniteScrollDown: true,
                infiniteScrollRowsFromEnd: 10,
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: 1,
                enableGridMenu: true,
                enableRowHeaderSelection: false,
                enableRowSelection: true,
                enableSelectAll: false,
                multiSelect: false,
                virtualizationThreshold: vm.searchResultsLength,
                columnDefs: columnDefs1,
                enableColumnMenus: false,
                onRegisterApi: function (gridApi) {
                    $scope.gridApi = gridApi;
                    gridApi.core.on.columnVisibilityChanged($scope, function (changedColumn) {
                        $scope.columnChanged = { name: changedColumn.colDef.name, visible: changedColumn.colDef.visible };
                    });
                    gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                        vm.selectedRow.matterName = row.entity.matterName
                        vm.selectedRow.matterClientUrl = row.entity.matterClientUrl
                        vm.selectedRow.matterGuid = row.entity.matterGuid;
                        vm.currentRow = row.entity;
                    });
                    //$scope.gridApi.cellNav.on.navigate($scope, function (newRowCol, oldRowCol) {
                    //    $scope.gridApi.selection.selectRow(newRowCol.row.entity);
                    //})
                    $animate.enabled(gridApi.grid.element, false);
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.sortChanged($scope.gridApi.grid, [vm.gridOptions.columnDefs[1]]);
                    $scope.$watch('gridApi.grid.isScrollingVertically', vm.watchFuncscroll);
                    gridApi.infiniteScroll.on.needLoadMoreData($scope, vm.watchFunc);
                    vm.setColumns();
                }
            };
            //#endregion

            vm.watchFuncscroll = function () { }

            //#region For setting the classes for ui-grid based on size
            vm.setColumns = function () {
                if ($window.innerWidth < 360) {
                    $interval(function () {
                        angular.element('#mattergrid .ui-grid-viewport').addClass('viewport');
                        angular.element('#mattergrid .ui-grid-viewport').removeClass('viewportlg');
                    }, 1000, 2);
                } else {
                    $interval(function () {
                        angular.element('#mattergrid .ui-grid-viewport').removeClass('viewport');
                        angular.element('#mattergrid .ui-grid-viewport').addClass('viewportlg');
                    }, 1000, 2);
                }
            }
            //#endregion

            //#region Functionality for infinite scroll 
            vm.pagenumber = 1;
            vm.responseNull = false;
            vm.watchFunc = function () {
                var promise = $q.defer();
                if (!vm.responseNull) {
                    vm.lazyloader = false;
                    vm.pagenumber = vm.pagenumber + 1;
                    var finalSearchText = '';
                    if (vm.selected != undefined && vm.selected != '') {
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ':"' + vm.selected.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyMatterId + ':"' + vm.selected.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyClientName + ':"' + vm.selected.trim() + '*")';
                    }

                    searchRequest.SearchObject.SearchTerm = finalSearchText;
                    searchRequest.SearchObject.PageNumber = vm.pagenumber;
                    get(searchRequest, function (response) {
                        if (response == "") {
                            vm.lazyloader = true;
                            vm.responseNull = true;
                        } else {
                            vm.lazyloader = true;
                            vm.gridOptions.data = vm.gridOptions.data.concat(response);
                        }
                        promise.resolve();
                        $scope.gridApi.infiniteScroll.dataLoaded();
                    });
                } else {
                    vm.lazyloader = true;
                }
                return promise.promise;
            }
            //#endregion

            //#region Setting the api calls 
            //search api call 
            function get(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'get',
                    data: options,
                    success: callback
                });
            }

            //Api call for pin matter
            function getPinnedMatters(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getPinnedMatters',
                    data: options,
                    success: callback
                });
            }

            //Callback function for pin 
            function PinMatters(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'PinMatters',
                    data: options,
                    success: callback
                });
            }

            //Callback function for unpin
            function UnpinMatters(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'UnpinMatters',
                    data: options,
                    success: callback
                });
            }

            //Callback function for Onenote Url Exists
            function OneNoteUrlExists(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'oneNoteUrlExists',
                    data: options,
                    success: callback
                });
            }

            //#region Functionality to check does URL exist in system.
            vm.checkUrlExists = function (data) {
                var loginUser = adalService.userInfo.userName.toLowerCase();
                vm.hideUpload = true;
                vm.urlExists = false;
                vm.dropDownMenuLoader = false;
                vm.dropDownMenu = false;
                var clientUrl = data.matterClientUrl.replace(vm.configsUri.SPOsiteURL, "")
                var oneNoteUrl = clientUrl + "/" + data.matterGuid + "_OneNote/" + data.matterName + "/" + data.matterGuid + ".onetoc2";
                var matterInformatiuonVM = {
                    Client: {
                        Url: data.matterClientUrl
                    },
                    RequestedUrl: oneNoteUrl
                }
                OneNoteUrlExists(matterInformatiuonVM, function (response) {
                    if (data.hideUpload.toLowerCase().indexOf(loginUser) > -1) {
                        vm.hideUpload = false;

                    }
                     else {
                        $timeout(function () { angular.element('.ECBItem.ms-ContextualMenu-link.upload.canUpload').focus() }, 1000);
                    }
                    jQuery.a11yfy.assertiveAnnounce("Expanded matter search results context menu");
                    vm.urlExists = response.oneNoteUrlExists
                    vm.dropDownMenuLoader = true;
                    vm.dropDownMenu = true;
                });
            }
            //#endregion

            //#region Code for Upload functionality
            vm.docUpLoadSuccess = false;
            vm.mailUpLoadSuccess = false;
            vm.loadingAttachments = false;
            vm.IsDupliacteDocument = false;
            vm.IsNonIdenticalContent = false;
            vm.showLoading = false;

            //Callback function for folder hierarchy
            function getFolderHierarchy(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getFolderHierarchy',
                    data: options,
                    success: callback
                });
            }
            //#region Functionality to get folder hirarcy.
            vm.getFolderHierarchy = function (matterName, matterUrl, matterGUID) {

                if ((matterName && matterName !== "") && (matterUrl && matterUrl !== "") && (matterGUID && matterGUID !== "")) {
                    var row = $filter("filter")(vm.gridOptions.data, matterGUID);
                    if (row.length > 0) {
                        vm.currentRow = row[0];
                    }
                    vm.selectedRow.matterName = matterName;
                    vm.selectedRow.matterClientUrl = matterUrl;
                    vm.selectedRow.matterGuid = matterGUID;
                    vm.selectedRow = vm.currentRow;
                }
                vm.allAttachmentDetails = [];
               
                
                ///function to get the default configurations of matter for select client
                //check wheather contentCheck for the uploaded document is neccessary 
                // also check if Additional matter Dialog box should be shown or not
                //if yes get the taxonomoy api and check if custom property with name MatterProvisionExtraPropertiesContentType
                //has been set or not. If that property has been set then get Additional Matter Properties and display the upload
                //dialog box               
                getContentCheckConfigurations(JSON.stringify(vm.selectedRow.matterClientUrl), function (response) {
                    if (!response.isError) {
                        var defaultMatterConfig = JSON.parse(response.code);
                        vm.oUploadGlobal.bAllowContentCheck = defaultMatterConfig.IsContentCheck;
                        if (defaultMatterConfig.ShowAdditionalPropertiesDialogBox && vm.currentRow.matterDefaultContentType) {
                            getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                                if (!response.isError) {
                                    vm.taxonomyData = response;
                                    getAdditionalMatterProperties();
                                }
                            });
                        }
                        else {
                            getFolderHierarchyApi();
                        }
                    }
                    else {
                        vm.oUploadGlobal.bAllowContentCheck = false;
                    }
                });               
            }

            // to get the matter document library folders
            function getFolderHierarchyApi() {
                var matterData = {
                    MatterName: vm.selectedRow.matterName,
                    MatterUrl: vm.selectedRow.matterClientUrl
                };
                getFolderHierarchy(matterData, function (response) {
                    vm.foldersList = response.foldersList;
                    vm.uploadedFiles = [];
                    function getNestedChildren(arr, parent) {
                        var parentList = []
                        for (var i in arr) {
                            if (arr[i].parentURL == parent) {
                                var children = getNestedChildren(arr, arr[i].url)

                                if (children.length) {
                                    arr[i].children = children;
                                    arr[i].active = parent == null ? true : false;
                                }
                                parentList.push(arr[i]);
                            }
                        }
                        return parentList
                    }
                    vm.foldersList = getNestedChildren(vm.foldersList, null);
                    if (vm.foldersList[0] !== null) { vm.showSelectedFolderTree(vm.foldersList[0]); }

                    jQuery('#UploadMatterModal').modal("show");
                    vm.initOutlook();
                    vm.lazyloader = true;
                });
            }
            //#endregion

            //#region Drop method will handle the file upload scenario for both email and attachment
            //Helper method which will handle mail or doc upload. This method will be called from inside vm.handleDrop
            function mailOrDocUpload(targetDrop, sourceFile, isOverwrite, performContentCheck, draggedFile, sOperation) {
                vm.isLoadingFromDesktopStarted = true;
                var attachments = [];
                var attachmentsArray = {};
                var mailId = '';

                if (sourceFile.isEmail && sourceFile.isEmail === "true") {

                    attachments = [];
                    mailId = Office.context.mailbox.item.itemId;
                    for (var iCounter = 0; iCounter < vm.allAttachmentDetails.length; iCounter++) {
                        attachmentsArray = {};
                        attachmentsArray.attachmentType = 0;
                        attachmentsArray.name = vm.allAttachmentDetails[iCounter].attachmentFileName;
                        attachmentsArray.isInline = false;
                        attachmentsArray.contentType = vm.allAttachmentDetails[iCounter].contentType;
                        attachmentsArray.attachmentType = vm.allAttachmentDetails[iCounter].attachmentType;
                        attachmentsArray.id = vm.allAttachmentDetails[iCounter].attachmentId;
                        attachmentsArray.size = vm.allAttachmentDetails[iCounter].size;
                        attachments.push(attachmentsArray);
                    }
                }
                else {
                    attachments = [];
                    attachmentsArray.attachmentType = 0;
                    attachmentsArray.name = sourceFile.title;
                    attachmentsArray.originalName = sourceFile.title;
                    attachmentsArray.isInline = false;
                    attachmentsArray.contentType = sourceFile.contentType;
                    attachmentsArray.id = sourceFile.attachmentId;
                    attachmentsArray.size = sourceFile.size;
                    attachments.push(attachmentsArray);
                    mailId = Office.context.mailbox.item.itemId;
                }
                var folders = [];
                folders.push(targetDrop.url);
                var attachmentRequestVM = {
                    Client: {
                        Url: vm.selectedRow.matterClientUrl
                    },
                    ServiceRequest: {
                        AttachmentToken: vm.attachmentToken,
                        FolderPath: folders,
                        EwsUrl: vm.ewsUrl,
                        DocumentLibraryName: vm.selectedRow.matterName,
                        MailId: mailId,
                        PerformContentCheck: performContentCheck,
                        Overwrite: isOverwrite,
                        Subject: vm.subject + ".eml",
                        AllowContentCheck: vm.oUploadGlobal.bAllowContentCheck,
                        Attachments: attachments
                    }
                }

                if (undefined !== sOperation && sOperation == "append") {
                    var date = new Date();
                    date = date.toISOString();
                    var reg = new RegExp(":", "g");
                    date = date.replace(reg, "_").replace(".", "_");
                    if (sourceFile.isEmail && sourceFile.isEmail === "true") {
                        var subject = vm.subject + ".eml";
                        var subjectNameWithoutExt = subject.substring(0, subject.lastIndexOf("."));
                        var extMail = subject.substr(subject.lastIndexOf(".") + 1);
                        attachmentRequestVM.ServiceRequest.Subject = subjectNameWithoutExt + "_" + date + "." + extMail;
                    }
                    else {

                        for (var attachment in attachments) {
                            var fileNameWithExt = attachments[attachment].name;
                            if (-1 !== fileNameWithExt.lastIndexOf(".")) {
                                var fileNameWithoutExt = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf("."));
                                var ext = fileNameWithExt.substr(fileNameWithExt.lastIndexOf(".") + 1);
                                attachments[attachment].name = fileNameWithoutExt + "_" + date + "." + ext;
                            } else {
                                attachments[attachment].name = fileNameWithExt + "_" + date;
                            }
                        }
                        attachmentRequestVM.ServiceRequest.Attachments = attachments;
                    }
                }

                if (vm.addtionalPropertiesAvaialbleForMatter) {
                    attachmentRequestVM.ServiceRequest.DocumentExtraProperties = vm.matterExtraPropertiesValues;
                }
                


                if (sourceFile.isEmail && sourceFile.isEmail === "true") {
                    vm.uploadEmail(attachmentRequestVM, draggedFile);
                }
                if (sourceFile.isEmail && sourceFile.isEmail === "false") {
                    vm.uploadAttachment(attachmentRequestVM, draggedFile);
                }
            }
            //#endregion

            //#region functionality to handle the files that has been dragged from the outlook
            vm.handleOutlookDrop = function (targetDrop, sourceFile) {
                vm.oUploadGlobal.successBanner = false;
                sourceFile.uploadSuccess = false;
                vm.targetDrop = targetDrop;
                vm.sourceFile = sourceFile;
                if (vm.addtionalPropertiesAvaialbleForMatter) {
                    vm.FilesFromDesktopOrMail = "filesfromoutlook"
                    jQuery('#UploadExtraMatterPropertiesModal').modal("show");
                } else {
                    var isOverwrite = false;
                    var performContentCheck = false;
                    var draggedFile = $filter("filter")(vm.allAttachmentDetails, sourceFile.attachmentId)[0];
                    mailOrDocUpload(targetDrop, sourceFile, isOverwrite, performContentCheck, draggedFile);
                }
               
            }
            //#endregion
            //#region  functionality to handle outlookdrop and desktop drop with extra document properties

            vm.SaveDocPropertiesAndUpload = function (filesFromDesktopOrMail) {
                jQuery('#UploadExtraMatterPropertiesModal').modal("hide");
                vm.isLoadingFromDesktopStarted = true;
                var documentProperties = undefined;
                var matterExtraPropertiesValues = undefined;
                //var attachmentRequestVM = vm.uploadedMailItemDetails.attachmentRequestVM;
                if (vm.addtionalPropertiesAvaialbleForMatter) {
                    documentProperties = setAdditionalMatterPropertiesFieldsData();
                    // var sourceFile = vm.uploadedMailItemDetails.sourceFile;
                    matterExtraPropertiesValues = {
                        ContentTypeName: vm.matterProvisionExtraPropertiesContentTypeName,
                        Fields: documentProperties
                    }
                    vm.matterExtraPropertiesValues = matterExtraPropertiesValues;
                }
                if (filesFromDesktopOrMail == "filesfromdesktop") {
                    vm.uploadDesktopDroppedFiles(matterExtraPropertiesValues);
                }
                else {

                    var isOverwrite = false;//Todo: Need to get from the config.js
                    var performContentCheck = false;//Todo: Need to get from the config.js
                    vm.isLoadingFromDesktopStarted = true;
                    var draggedFile = $filter("filter")(vm.allAttachmentDetails, vm.sourceFile.attachmentId)[0];
                    mailOrDocUpload(vm.targetDrop, vm.sourceFile, isOverwrite, performContentCheck, draggedFile);
                }

            }
            //#endregion
            //#region functionality will handle the files that has been dragged from the user desktop
            vm.ducplicateSourceFile = [];
             vm.DesktopDroppedFiles = {};
             vm.handleDesktopDrop = function (targetDropUrl, sourceFiles, isOverwrite) {
                 vm.FilesFromDesktopOrMail = "filesfromdesktop";
               // jQuery('#UploadExtraMatterPropertiesModal').modal("show");
                vm.oUploadGlobal.successBanner = false;
                vm.DesktopDroppedFiles = {};
                vm.DesktopDroppedFiles.targetDropUrl = targetDropUrl;
                vm.DesktopDroppedFiles.sourceFiles = sourceFiles;
                vm.DesktopDroppedFiles.isOverwrite = isOverwrite;
                if (vm.addtionalPropertiesAvaialbleForMatter) {
                    vm.FilesFromDesktopOrMail = "filesfromdesktop";
                    jQuery('#UploadExtraMatterPropertiesModal').modal("show");
                } else {
                    vm.uploadDesktopDroppedFiles(null);
                }
            }


            vm.uploadDesktopDroppedFiles = function (matterExtraPropertiesValues) {
                vm.oUploadGlobal.successBanner = false;
                vm.isLoadingFromDesktopStarted = true;
                var targetDropUrl=vm.DesktopDroppedFiles.targetDropUrl;
                var sourceFiles= vm.DesktopDroppedFiles.sourceFiles;
                var isOverwrite = vm.DesktopDroppedFiles.isOverwrite;
                var fd = new FormData();
                fd.append('targetDropUrl', targetDropUrl);
                fd.append('folderUrl', targetDropUrl)
                fd.append('documentLibraryName', vm.selectedRow.matterName)
                fd.append('clientUrl', vm.selectedRow.matterClientUrl);
                fd.append('AllowContentCheck', vm.oUploadGlobal.bAllowContentCheck);
                matterExtraPropertiesValues = JSON.stringify(matterExtraPropertiesValues);
                fd.append('DocumentExtraProperties', matterExtraPropertiesValues)
                var nCount = 0;
                angular.forEach(sourceFiles, function (file) {
                    fd.append('file', file);
                    fd.append("Overwrite" + nCount++, isOverwrite);
                });
                jQuery.a11yfy.assertiveAnnounce('file upload in progress');
                $http.post("/api/v1/document/uploadfiles", fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined },
                    timeout: vm.oUploadGlobal.canceler.promise
                }).then(function (response) {
                    vm.isLoadingFromDesktopStarted = false;

                    if (response.status == 200) {
                        if (response.data.length !== 0) {
                            var tempFile = [];
                            for (var i = 0; i < response.data.length; i++) {
                                if (!response.data[i].isError) {
                                    response.data[i].dropFolder = response.data[i].dropFolder == vm.selectedRow.matterGuid ? vm.selectedRow.matterName : response.data[i].dropFolder;
                                    vm.uploadedFiles.push(response.data[i]);
                                    tempFile.push(response.data[i]);
                                    vm.oUploadGlobal.successBanner = (tempFile.length == sourceFiles.length) ? true : false;
                                    jQuery.a11yfy.assertiveAnnounce('file upload completed');
                                    vm.ducplicateSourceFile = vm.ducplicateSourceFile.filter(function (item) {
                                        return item.fileName !== response.data[i].fileName;
                                    });
                                } else {
                                    if (response.data[i].code == "DuplicateDocument" || response.data[i].code == "IdenticalContent") {
                                        vm.IsDupliacteDocument = true;
                                        if (response.data[i].value.split("|")[1]) {
                                            response.data[i].contentCheck = response.data[i].value.split("|")[1];
                                            response.data[i].saveLatestVersion = "True";
                                            response.data[i].cancel = "True";
                                            response.data[i].append = vm.overwriteConfiguration(response.data[i].fileName);
                                            response.data[i].value = response.data[i].value.split("|")[0];
                                            response.data[i].fileType = "remotefile";
                                            if (response.data[i].value.split("|")[1]) {
                                                response.data[i].userCancelledContentCheckPerform = false;
                                            }
                                            vm.ducplicateSourceFile.push(response.data[i]);
                                            vm.oUploadGlobal.arrFiles.push(vm.files[i]);
                                            vm.oUploadGlobal.successBanner = false;
                                        }
                                        else {
                                            var file = $filter("filter")(vm.ducplicateSourceFile, response.data[i].fileName);
                                            if (file.length > 0) {
                                                if (!file[0].userCancelledContentCheckPerform) {
                                                    file[0].value = file[0].value + "<br/><br/>" + response.data[i].value;
                                                }
                                                file[0].saveLatestVersion = "True";
                                                file[0].cancel = "True";
                                                file[0].contentCheck = "False";
                                            }
                                        }

                                    }
                                    else {
                                        vm.IsDupliacteDocument = true;
                                        response.data[i].ok = "True";
                                        response.data[i].value = "The file <b >" + response.data[i].fileName + " </b> is failed to upload";
                                        vm.ducplicateSourceFile.push(response.data[i]);
                                    }
                                }
                            }

                        }
                    } else {
                        //To Do error handling implementation
                    }
                }).catch(function (response) {
                    vm.isLoadingFromDesktopStarted = false;
                    console.error('Gists error', response.status, response.data);
                })
            }
            vm.uploadedFiles = [];
            //#endregion

            //#region functionality to handle when mail gets uploaded
            vm.uploadEmail = function (attachmentRequestVM, droppedAttachedFile) {
                jQuery.a11yfy.assertiveAnnounce('mail attachment upload in progress');
                uploadEmail(attachmentRequestVM, function (response) {
                    vm.showLoading = false;
                    var target = vm.targetDrop;
                    var source = vm.sourceFile;
                    //If the mail upload is success
                    if (response.code === "OK" && response.value === "Attachment upload success") {
                        jQuery.a11yfy.assertiveAnnounce('mail attachment successfully uploaded to ' + vm.targetDrop.name);
                        var subject = Office.context.mailbox.item.subject;
                        subject = subject.substring(0, subject.lastIndexOf("."));
                        vm.mailUpLoadSuccess = true;
                        vm.mailUploadedFile = subject;
                        vm.mailUploadedFolder = vm.targetDrop.name;
                        vm.isLoadingFromDesktopStarted = false;
                        droppedAttachedFile.uploadSuccess = true;
                        vm.oUploadGlobal.successBanner = droppedAttachedFile.uploadSuccess ? true : false;
                    }
                        //If the mail upload is not success
                    else if (response.code === "DuplicateDocument") {
                        vm.IsDupliacteDocument = true; //ToDo:Set it to false on mail upload dialog open
                        vm.IsNonIdenticalContent = false;

                        var selectedOverwriteConfiguration = vm.globalSettings.overwriteDupliacteFileNameWithDateTimeFor.trim().toLocaleUpperCase(),
                        bAppendEnabled = false,
                        fileExtension = "undefined" !== typeof source && source.title ? source.title.trim().substring(source.title.trim().lastIndexOf(".") + 1) : "";
                        var isEmail = droppedAttachedFile.isEmail ? true : (1 === parseInt(droppedAttachedFile.attachmentType) || "eml" === fileExtension) ? true : false;
                        bAppendEnabled = attachmentEmailOverwriteConfiguration(selectedOverwriteConfiguration, isEmail);
                        response.contentCheck = response.value.split("|")[1];
                        response.value = response.value.split("|")[0];
                        jQuery.a11yfy.assertiveAnnounce(response.value);
                        response.saveLatestVersion = "True";
                        response.cancel = "True";
                        response.append = bAppendEnabled;
                        var duplicFile = response;
                        duplicFile.droppedUrl = target;
                        duplicFile.source = source;
                        duplicFile.fileType = "attacheddocument"
                        vm.ducplicateSourceFile.push(duplicFile);
                    }
                    else if (response.code === "NonIdenticalContent") {
                        vm.IsNonIdenticalContent = true; //ToDo:Set it to false on mail upload dialog open
                        vm.IsDupliacteDocument = false;
                    }
                    else if (response.code === "IdenticalContent") {
                        var dupliFile = vm.ducplicateSourceFile[0];
                        dupliFile.value = dupliFile.value + "<br/><br/>" + response.value;
                        jQuery.a11yfy.assertiveAnnounce(dupliFile.value);
                        dupliFile.saveLatestVersion = "True";
                        dupliFile.cancel = "True";
                        dupliFile.append = true;
                        dupliFile.contentCheck = "False";
                    }
                    console.log(response);
                    vm.isLoadingFromDesktopStarted = false;
                });
            }
            //#endregion

            //#region functionality to handle when mail gets uploaded
            function attachmentEmailOverwriteConfiguration(selectedOverwriteConfiguration, isEmail) {
                var bAppendEnabled = false;
                switch (selectedOverwriteConfiguration) {
                    case "BOTH":
                        bAppendEnabled = true;
                        break;
                    case "DOCUMENT ONLY":
                        bAppendEnabled = isEmail ? false : true;
                        break;
                    default:
                        bAppendEnabled = isEmail ? true : false;
                        break;
                }
                return bAppendEnabled;
            }

            //Call Web API method for upload mail
            function uploadEmail(attachmentRequestVM, callback) {
                api({
                    resource: 'matterResource',
                    method: 'uploadEmail',
                    data: attachmentRequestVM,
                    success: callback
                });
            }
            //#endregion

            //#region Call back function when attachment gets uploaded
            vm.uploadAttachment = function (attachmentRequestVM, droppedAttachedFile) {
                jQuery.a11yfy.assertiveAnnounce("attachment upload in progress");
                vm.oUploadGlobal.successBanner = false;
                uploadAttachment(attachmentRequestVM, function (response) {
                    vm.isLoadingFromDesktopStarted = false;
                    vm.showLoading = false;
                    vm.oUploadGlobal.iActiveUploadRequest--;
                    var target = vm.targetDrop;
                    var source = vm.sourceFile;
                    //If the upload is success
                    if (response.code === "OK" && response.value === "Attachment upload success") {
                        vm.IsDupliacteDocument = false;
                        vm.IsNonIdenticalContent = false;
                        vm.docUpLoadSuccess = true;
                        if (vm.oUploadGlobal.iActiveUploadRequest === 0) {
                            //ToDo: Remove the animated image
                        }
                        var extEmailOrMsg = vm.sourceFile.title.substr(vm.sourceFile.title.lastIndexOf(".") + 1);
                        if (extEmailOrMsg === "eml" || extEmailOrMsg === "msg") {
                            vm.docUploadedFolder = vm.sourceFile.title.substring(0, vm.sourceFile.title.lastIndexOf("."));

                        }
                        else {
                            vm.targetDrop.name = vm.targetDrop.name == vm.selectedRow.matterGuid ? vm.selectedRow.matterName : vm.targetDrop.name;

                        }

                        jQuery.a11yfy.assertiveAnnounce("attachment successfully uploaded to " + vm.targetDrop.name);
                        droppedAttachedFile.uploadedFolder = vm.targetDrop.name;
                        vm.docUploadedFolder = vm.targetDrop.name;
                        droppedAttachedFile.uploadSuccess = true;
                        console.log(droppedAttachedFile.counter);
                        vm.oUploadGlobal.successBanner = droppedAttachedFile.uploadSuccess ? true : false;
                    }
                        //If the attachment upload is not success
                    else if (response.code === "DuplicateDocument") {

                        vm.IsDupliacteDocument = true; //ToDo:Set it to false on mail upload dialog open
                        vm.IsNonIdenticalContent = false;
                        var selectedOverwriteConfiguration = vm.globalSettings.overwriteDupliacteFileNameWithDateTimeFor.trim().toLocaleUpperCase(),
                        bAppendEnabled = false,
                        fileExtension = "undefined" !== typeof source && source.title ? source.title.trim().substring(source.title.trim().lastIndexOf(".") + 1) : "";
                        var isEmail = droppedAttachedFile.isEmail ? true : (1 === parseInt(droppedAttachedFile.attachmentType) || "eml" === fileExtension) ? true : false;
                        bAppendEnabled = attachmentEmailOverwriteConfiguration(selectedOverwriteConfiguration, isEmail);
                        response.contentCheck = response.value.split("|")[1];
                        response.value = response.value.split("|")[0];
                        jQuery.a11yfy.assertiveAnnounce(response.value);
                        response.saveLatestVersion = "True";
                        response.cancel = "True";
                        response.append = bAppendEnabled;
                        var duplicFile = response;
                        duplicFile.droppedUrl = target;
                        duplicFile.source = source;
                        duplicFile.fileType = "attacheddocument";
                        vm.ducplicateSourceFile.push(duplicFile);
                    }
                        //NonIdenticalContent
                    else if (response.code === "NonIdenticalContent") {
                        vm.IsNonIdenticalContent = true; //ToDo:Set it to false on mail upload dialog open
                        vm.IsDupliacteDocument = false;
                    }
                    else if (response.code === "IdenticalContent") {
                        var dupliFile = vm.ducplicateSourceFile[0];
                        dupliFile.value = dupliFile.value + "<br/><br/>" + response.value;
                        dupliFile.saveLatestVersion = "True";
                        dupliFile.cancel = "True";
                        dupliFile.contentCheck = "False";
                        jQuery.a11yfy.assertiveAnnounce(dupliFile.value);
                    }
                });
            }

            //Call Web API method for upload attachement
            function uploadAttachment(attachmentRequestVM, callback) {
                api({
                    resource: 'matterResource',
                    method: 'uploadAttachment',
                    data: attachmentRequestVM,
                    success: callback
                });
            }

            //Remove the draggable directive after successful file upload
            function removeDraggableDirective() {
                var divElement = angular.element(jQuery("#" + vm.sourceFile.id));
            }

            //Remove the draggable directive after successful file upload
            function addDraggableDirective() {
                var divElement = angular.element(document.querySelector("#" + vm.sourceFile.id));
                divElement.removeAttr("draggable");
            }
            //#endregion


            //#region Functionality to display matter as pin or unpin.
            vm.showMatterAsPinOrUnpin = function (response, searchRequest) {
                getPinnedMatters(searchRequest, function (pinnedResponse) {
                    if (pinnedResponse && pinnedResponse.length > 0) {
                        angular.forEach(pinnedResponse, function (pinobj) {
                            angular.forEach(response, function (res) {
                                //Check if the pinned matter name is equal to search matter name
                                if (pinobj.matterName == res.matterName) {
                                    if (res.ismatterdone == undefined && !res.ismatterdone) {
                                        res.MatterInfo = "Unpin this matter";
                                        res.ismatterdone = true;
                                    }
                                }
                            });
                        });
                        vm.gridOptions.data = response;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    } else {
                        vm.gridOptions.data = response;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                });
            }
            //#endregion

            //#region Functionality to edit attached files.
            vm.editAttachment = function (element, event) {
                //ToDo: Use Angular data binding functionality
                var editIcon = $("#" + event.target.id);
                var rowIndex = event.target.id.charAt(0);
                var saveIcon = $("#" + rowIndex + "saveIcon");
                var attachIcon = $("#" + rowIndex + "attachIcon");
                var thisAttachment = $("#" + rowIndex + "attachment");
                var thisAttachmentText = $("#" + rowIndex + "attachmentText");
                var attachmentText = thisAttachment[0].innerHTML;

                if (saveIcon.hasClass("hide")) {
                    saveIcon.removeClass("hide");
                    editIcon.addClass("hide");
                    attachIcon.addClass("hide");
                }

                if (thisAttachmentText.hasClass("hide")) {
                    thisAttachmentText.removeClass("hide");
                    thisAttachment.addClass("hide");
                    thisAttachmentText.val(attachmentText);
                }
            }
            //#endregion

            //#region Functionality to save attached files.
            vm.saveAttachment = function (element, event) {
                //ToDo: Use Angular data binding functionality
                var saveIcon = $("#" + event.target.id);
                var rowIndex = event.target.id.charAt(0);
                var editIcon = $("#" + rowIndex + "editIcon");
                var thisAttachment = $("#" + rowIndex + "attachment");
                var thisAttachmentText = $("#" + rowIndex + "attachmentText");
                var attachIcon = $("#" + rowIndex + "attachIcon");
                var attachmentText = thisAttachmentText[0].value.trim();
                var oldText = thisAttachment[0].innerHTML;
                if (!vm.oUploadGlobal.regularInvalidCharacter.test(attachmentText) &&
                    !vm.oUploadGlobal.regularExtraSpace.test(attachmentText) &&
                    !vm.oUploadGlobal.regularInvalidRule.test(attachmentText) &&
                    !vm.oUploadGlobal.regularStartEnd.test(attachmentText)) {
                    if (editIcon.hasClass("hide")) {
                        editIcon.removeClass("hide");
                        attachIcon.removeClass("hide");
                        saveIcon.addClass("hide");
                    }
                    if (thisAttachment.hasClass("hide")) {
                        thisAttachment.removeClass("hide");
                        thisAttachmentText.addClass("hide");
                        if ("" === attachmentText) {
                            thisAttachment.html(oldText);
                            thisAttachment.attr("title", oldText);
                        } else {
                            thisAttachment.html(attachmentText);
                            thisAttachment.attr("title", attachmentText);
                        }
                    }
                }
                else {
                    vm.oUploadGlobal.regularInvalidCharacter.lastIndex = 0;
                    //ToDo:showErrorNotification(thisAttachmentText, "Invalid character");
                }
            }
            //#endregion

            //#region  Methods for Error Notifications Dialogs

            //Methods for over writing the document
            vm.overWriteDocument = function (operation) {
                if (operation === "overwrite") {
                    jQuery('#overWriteNo').hide();
                    vm.showLoading = true;
                    vm.IsDupliacteDocument = false;
                    vm.IsNonIdenticalContent = false;
                    mailOrDocUpload(vm.targetDrop, vm.sourceFile, vm.IsDupliacteDocument, vm.IsNonIdenticalContent);
                }
                else if (operation === "contentCheck") {
                    vm.showLoading = true;
                }
                else if (operation === "append") {
                    vm.showLoading = true;
                }
            }

            //Method for closing the notification dialog
            vm.closeNotificationDialog = function () {
                vm.IsDupliacteDocument = false;
                vm.IsNonIdenticalContent = false;
                vm.showLoading = false;
                jQuery('#overWriteNo').hide();
            }

            //#endregion


            //#region open upload model popu.
            vm.Openuploadmodal = function (matterName, matterUrl, matterGUID) {
                vm.lazyloader = false;
                vm.getFolderHierarchy(matterName, matterUrl, matterGUID);
                vm.oUploadGlobal.successBanner = false;
                vm.isLoadingFromDesktopStarted = false;
            }

            vm.oUploadGlobal = {
                regularInvalidCharacter: new RegExp("[\*\?\|\\\t/:\"\"'<>#{}%~&]", "g"),
                regularStartEnd: new RegExp("^[\. ]|[\. ]$", "g"),
                regularExtraSpace: new RegExp(" {2,}", "g"),
                regularInvalidRule: new RegExp("[\.]{2,}", "g"),
                oUploadParameter: [],
                sClientRelativeUrl: "",
                sFolderUrl: "",
                arrContent: [],
                arrFiles: [],
                arrOverwrite: [],
                src: [],
                iActiveUploadRequest: 0,
                oDrilldownParameter: { nCurrentLevel: 0, sCurrentParentUrl: "", sRootUrl: "" },
                sNotificationMsg: "",
                bAppendOptionEnabled: false,
                oXHR: new XMLHttpRequest(),
                bIsAbortedCC: false,
                bAllowContentCheck: false,
                canceler: $q.defer(),
                successBanner: false
            };

            //#endregion

            //Callback function for attachment token upload.
            vm.attachmentTokenCallbackEmailClient = function (asyncResult, userContext) {
                "use strict";
                if (asyncResult.status === "succeeded") {
                    vm.attachmentToken = asyncResult.value;
                    vm.createMailPopup();
                    vm.mailUpLoadSuccess = false;
                    vm.mailUploadedFile = null;
                    vm.mailUploadedFolder = null;;
                    vm.loadingAttachments = false;
                    $scope.$apply();
                }
            }

            //Functionality to get icon source.
            vm.getIconSource = function (sExtension) {
                var uploadImageDocumentIcon = configs.uri.SPOsiteURL + vm.uploadMessages.uploadImageDocumentIcon;
                var iconSrc = uploadImageDocumentIcon.replace("{0}", sExtension);
                iconSrc = (-1 < vm.uploadMessages.uploadPNGIconExtensions.indexOf(sExtension)) ?
                                iconSrc.substring(0, uploadImageDocumentIcon.lastIndexOf(".") + 1) + "png" : iconSrc;
                return iconSrc;
            }

            //Functionality to check white spaces in enter value.
            vm.checkEmptyorWhitespace = function (input) {
                "use strict";
                if (/\S/.test(input)) {
                    return input;
                }
                return oFindMatterConstants.No_Subject_Mail;
            }

            //#region Functionality to initialize application in outlook.
            vm.initOutlook = function () {

                vm.IsDupliacteDocument = false;
                if (Office.context && Office.context.mailbox) {
                    vm.loadingAttachments = true;
                    vm.attachmentToken = '';
                    vm.ewsUrl = Office.context.mailbox.ewsUrl;
                    vm.subject = Office.context.mailbox.item.subject;
                    vm.mailId = Office.context.mailbox.item.itemId;
                    vm.attachments = new Array();
                    var iCounter = 0;
                    if (Office.context.mailbox.item.attachments) {
                        var attachmentsLength = Office.context.mailbox.item.attachments.length;
                        for (iCounter = 0; iCounter < attachmentsLength; iCounter++) {
                            if (Office.context.mailbox.item.attachments[iCounter].hasOwnProperty("$0_0")) {
                                vm.attachments[iCounter] = JSON.parse(JSON.stringify(Office.context.mailbox.item.attachments[iCounter].$0_0));
                            }
                            else if (Office.context.mailbox.item.attachments[iCounter].hasOwnProperty("_data$p$0")) {
                                vm.attachments[iCounter] = JSON.parse(JSON.stringify(Office.context.mailbox.item.attachments[iCounter]._data$p$0));
                            }
                        }
                        Office.context.mailbox.getCallbackTokenAsync(vm.attachmentTokenCallbackEmailClient);
                    }
                }
            }
            //#endregion

            //#region Functionality to create mail popup to user.
            vm.createMailPopup = function () {
                var sImageChunk = "", nIDCounter = 0;
                var attachmentName = "", mailSubject = "", sAttachmentFileName = "", bHasEML = false, attachmentType = "", sContentType = "", sExtension = "", iconSrc = "";
                vm.allAttachmentDetails = []
                var individualAttachment = {};
                //For just email
                individualAttachment.attachmentId = Office.context.mailbox.item.itemId;
                individualAttachment.counter = nIDCounter;
                console.log("mailSubject");
                mailSubject = vm.checkEmptyorWhitespace(Office.context.mailbox.item.subject);
                console.log(mailSubject);
                mailSubject = mailSubject.replace(vm.oUploadGlobal.regularExtraSpace, "")
                                            .replace(vm.oUploadGlobal.regularInvalidCharacter, "")
                                            .replace(vm.oUploadGlobal.regularInvalidRule, ".")
                                            .replace(vm.oUploadGlobal.regularStartEnd, "");
                console.log(mailSubject);
                vm.subject = mailSubject;
                //Office.context.mailbox.item.subject=mailSubject;
                individualAttachment.attachmentFileName = mailSubject;
                individualAttachment.isEmail = true;
                individualAttachment.uploadSuccess = false;
                vm.allAttachmentDetails.push(individualAttachment);
                //For all attachments in the current email
                for (var attachment in vm.attachments) {
                    individualAttachment = {};
                    bHasEML = false;
                    nIDCounter++;
                    attachmentName = vm.checkEmptyorWhitespace(vm.attachments[attachment].name);
                    attachmentName = attachmentName.replace(vm.oUploadGlobal.regularExtraSpace, "")
                                                .replace(vm.oUploadGlobal.regularInvalidCharacter, "")
                                                .replace(vm.oUploadGlobal.regularInvalidRule, ".")
                                                .replace(vm.oUploadGlobal.regularStartEnd, "");
                    if (attachmentName.lastIndexOf(".eml") === attachmentName.length - 4) {
                        sAttachmentFileName = attachmentName.substring(0, attachmentName.lastIndexOf(".eml"));
                        bHasEML = true;
                    } else {
                        sAttachmentFileName = attachmentName;
                    }

                    var attachmentType = vm.attachments[attachment].hasOwnProperty("attachmentType") ? vm.attachments[attachment].attachmentType : "";
                    var sContentType = vm.attachments[attachment].hasOwnProperty("contentType") ? vm.attachments[attachment].contentType : "";
                    var sExtension = -1 < attachmentName.lastIndexOf(".") ? attachmentName.substring(attachmentName.lastIndexOf(".") + 1) : 1 === parseInt(attachmentType) ? "msg" : "";
                    var iconSrc = vm.getIconSource(sExtension);
                    individualAttachment.contentType = sContentType;
                    individualAttachment.attachmentId = vm.attachments[attachment].id;
                    individualAttachment.counter = nIDCounter;
                    individualAttachment.attachmentFileName = sAttachmentFileName;
                    individualAttachment.bHasEML = bHasEML;
                    individualAttachment.attachmentType = attachmentType;
                    individualAttachment.iconSrc = iconSrc;
                    individualAttachment.extension = sExtension;
                    individualAttachment.isEmail = false;
                    individualAttachment.uploadSuccess = false;
                    individualAttachment.uploadedFolder = null;
                    individualAttachment.size = vm.attachments[attachment].size;
                    individualAttachment.attachmentType = attachmentType;
                    vm.allAttachmentDetails.push(individualAttachment);
                }
            }
            //#endregion

            //#region Declaraing object for search request.
            var searchRequest = {
                Client: {
                    Url: configs.global.repositoryUrl
                },
                SearchObject: {
                    PageNumber: 1,
                    ItemsPerPage: vm.searchResultsLength,
                    SearchTerm: "",
                    IsUnique: false,
                    UniqueColumnName: '',
                    FilterValue: '',
                    Filters: {
                        AOLList: [],
                        ClientName: "",
                        ClientsList: [],
                        PGList: [],
                        DateFilters: {
                            CreatedFromDate: "", CreatedToDate: "", ModifiedFromDate: "", ModifiedToDate: "", OpenDateFrom: "", OpenDateTo: ""
                        },
                        DocumentAuthor: "",
                        DocumentCheckoutUsers: "",
                        FilterByMe: 1,
                        FromDate: "",
                        Name: "",
                        ResponsibleAttorneys: "",
                        SubareaOfLaw: "",
                        ToDate: "",
                        ProjectName: "",
                        ProjectID: "",
                        PracticeGroup: "",
                        AreaOfLaw: ""
                    },
                    Sort:
                            {
                                ByProperty: "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "",
                                ByColumn: "ModifiedFromDate",
                                Direction: 1,
                                SortAndFilterPinnedData: false
                            }
                }
            }
            //#endregion

            //#region Create filter text with different managed properties.
            vm.filterSearch = function (val) {
                if (val.length > 3) {

                    searchRequest.SearchObject.IsUnique = true;
                    searchRequest.SearchObject.FilterValue = val;
                    if (vm.searchexp == vm.configSearchContent.ManagedPropertyMatterName) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyMatterName
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyMatterName + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertyClientName && !vm.globalSettings.isBackwardCompatible) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyClientName
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyClientName + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertyPracticeGroup) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyPracticeGroup
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyPracticeGroup + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertyResponsibleAttorney) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyResponsibleAttorney
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertySubAreaOfLaw) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertySubAreaOfLaw
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertyAreaOfLaw) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyAreaOfLaw
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyAreaOfLaw + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                    else if (vm.searchexp == vm.configSearchContent.ManagedPropertyMatterId) {
                        searchRequest.SearchObject.UniqueColumnName = vm.configSearchContent.ManagedPropertyMatterId;
                        vm.mattersearch("" + vm.configSearchContent.ManagedPropertyMatterId + ":" + val + "*(" + vm.configSearchContent.ManagedPropertyMatterName + ":* OR " + vm.configSearchContent.ManagedPropertyMatterId + ":* OR " + vm.configSearchContent.ManagedPropertyClientName + ":*)", vm.searchexp, false);
                    }
                }
            }
            //#endregion

            //#region For filtering the grid when clicked on search button
            vm.searchMatter = function (val) {
                var finalSearchText = "";
                if (val != "") {
                    if (val.indexOf("(") == 0 && val.indexOf(")") == val.length - 1) {
                        finalSearchText = "(" + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + val + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + val + "*\")";
                    }
                    else if (val.lastIndexOf("(") > 0 && val.lastIndexOf(")") == val.length - 1) {
                        var matterName = val.substring(0, val.lastIndexOf("(") - 1);
                        var matterID = val.substring(val.lastIndexOf("("), val.lastIndexOf(")") + 1);
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + matterName.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + matterID.trim() + "*\")";
                    }
                    else {
                        finalSearchText = "(" + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + val.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + val.trim() + "*\")";
                    }
                }
                var searchMatterRequest = {
                    Client: {
                        Url: configs.global.repositoryUrl
                    },
                    SearchObject: {
                        PageNumber: 1,
                        ItemsPerPage: 5,
                        SearchTerm: finalSearchText,
                        Filters: {
                            AOLList: [],
                            ClientName: "",
                            ClientsList: [],
                            DateFilters: {
                                CreatedFromDate: "", CreatedToDate: "", ModifiedFromDate: "", ModifiedToDate: "", OpenDateFrom: "", OpenDateTo: ""
                            },
                            DocumentAuthor: "",
                            DocumentCheckoutUsers: "",
                            FilterByMe: 1,
                            FromDate: "",
                            Name: "",
                            PGList: [],
                            ResponsibleAttorneys: "",
                            SubareaOfLaw: "",
                            ToDate: ""
                        },
                        Sort:
                                {
                                    ByProperty: "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "",
                                    Direction: 1,
                                    ByColumn: "ModifiedFromDate",
                                }
                    }
                }
                if (vm.matterid == 2) {
                    searchMatterRequest.SearchObject.Filters.FilterByMe = 1;
                } else {
                    searchMatterRequest.SearchObject.Filters.FilterByMe = 0;
                }
                return matterResource.get(searchMatterRequest).$promise;
            }
            //#endregion

            //#region Functionality to global level search
            vm.search = function () {
                vm.clearFiltersForSearch();
                vm.lazyloader = false;
                vm.divuigrid = false;
                vm.nodata = false;
                searchRequest.SearchObject.ItemsPerPage = vm.searchResultsLength;
                if (vm.matterid == 3) {
                    vm.matterid = 1;
                    vm.mattername = "" + vm.matterConfigContent.Dropdown1Item1 + "";
                }
                if (vm.matterid == 2) {
                    searchRequest.SearchObject.Filters.FilterByMe = 1;
                } else {
                    searchRequest.SearchObject.Filters.FilterByMe = 0;
                }
                vm.pagenumber = 1;
                var searchToText = '';
                var finalSearchText = '';
                if (vm.selected != "") {

                    if (vm.selected.indexOf("(") == 0 && vm.selected.indexOf(")") == vm.selected.length - 1) {
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ':"' + vm.selected.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyMatterId + ':"' + vm.selected.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyClientName + ':"' + vm.selected.trim() + '*")';
                    }
                    else if (vm.selected.lastIndexOf("(") > 0 && vm.selected.lastIndexOf(")") == vm.selected.length - 1) {
                        var matterName = vm.selected.substring(0, vm.selected.lastIndexOf("(") - 1);
                        var matterID = vm.selected.substring(vm.selected.lastIndexOf("("), vm.selected.lastIndexOf(")") + 1);
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + matterName.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + matterID.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyClientName + ":\"" + vm.selected.trim() + "*\")";
                    }
                    else {
                        finalSearchText = "(" + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + vm.selected.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + vm.selected.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyClientName + ":\"" + vm.selected.trim() + "*\")"
                    }
                }
                searchRequest.SearchObject.SearchTerm = finalSearchText;
                get(searchRequest, function (response) {
                    if (response == "" || response.errorCode == "500" || response.lenth == 0) {
                        vm.gridOptions.data = response;
                        vm.lazyloader = true;
                        vm.divuigrid = true;
                        vm.nodata = true;
                        $interval(function () { vm.showSortExp(); }, 2000, 3);
                    } else {
                        vm.showMatterAsPinOrUnpin(response, searchRequest);
                        vm.divuigrid = true;
                        vm.nodata = false;
                        vm.lazyloader = true;
                        $interval(function () { vm.showSortExp(); }, 2000, 3);
                    }
                });
            }
            //#endregion

            //#region for setting the mattername in dropdown
            vm.SetMatters = function (id, name) {
               
                vm.pinnedorunpinned = false;
                vm.clearAllFilter();
                vm.clearAllFiltersofSort();
                vm.mattername = name;
                vm.GetMatters(id);
                vm.matterid = id;
            }
            //#endregion

            //#region Functionality to search matter by property and searchterm
            vm.mattersearch = function (term, property, bool) {
                vm.lazyloaderFilter = false;
                vm.filternodata = false;
                searchRequest.SearchObject.PageNumber = 1;
                searchRequest.SearchObject.Sort.ByProperty = property;
                searchRequest.SearchObject.Sort.Direction = 0;
                if (bool) {
                    vm.matterheader = true;
                    vm.divuigrid = false;
                    vm.lazyloader = false;
                    searchRequest.SearchObject.ItemsPerPage = vm.searchResultsLength;
                    if (property == "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "") {
                        vm.attorneySearchTerm = term;
                        searchRequest.SearchObject.Filters.ResponsibleAttorneys = term;
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.attorneyfilter = true;
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "") {
                        vm.areaSearchTerm = term;
                        vm.subAreaOfLawSearchTerm = term;
                        searchRequest.SearchObject.Filters.SubareaOfLaw = term.trim();
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        if (!vm.globalSettings.isBackwardCompatible) {
                            vm.areafilter = true;
                        } else {
                            vm.subareafilter = true;
                        }
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertyMatterName + "") {
                        vm.searchTerm = term;
                        searchRequest.SearchObject.Filters.Name = term;
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.matterfilter = true;
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertyClientName + "" && !vm.globalSettings.isBackwardCompatible) {
                        vm.clientSearchTerm = term;
                        searchRequest.SearchObject.Filters.ClientName = term;
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.clientfilter = true;
                        vm.areaoflawfilter = true
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertyAreaOfLaw + "" && vm.globalSettings.isBackwardCompatible) {
                        vm.areaOfLawSearchTerm = term;
                        searchRequest.SearchObject.Filters.AreaOfLaw = term.trim();
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.areaoflawfilter = true;
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertyPracticeGroup + "") {
                        vm.practiceGroupSearchTerm = term;
                        searchRequest.SearchObject.Filters.PracticeGroup = term.trim();
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.practiceGroupfilter = true;
                    }
                    else if (property == "" + vm.configSearchContent.ManagedPropertyMatterId + "") {
                        vm.projectIDSearchTerm = term;
                        searchRequest.SearchObject.Filters.ProjectID = term.trim();
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.projectIDfilter = true;
                    }
                } else {
                    searchRequest.SearchObject.ItemsPerPage = 50;
                    searchRequest.SearchObject.SearchTerm = term;
                    if (property == "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        if (searchRequest.SearchObject.Filters.previousResponsibleAttorneyValue != '') {
                            vm.previousResponsibleAttorneyValue = searchRequest.SearchObject.Filters.previousResponsibleAttorneyValue;
                            searchRequest.SearchObject.Filters.previousResponsibleAttorneyValue = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        if (searchRequest.SearchObject.Filters.SubareaOfLaw != '') {
                            vm.previousSubAreaOfLawValue = searchRequest.SearchObject.Filters.SubareaOfLaw;
                            searchRequest.SearchObject.Filters.SubareaOfLaw = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertyAreaOfLaw + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyAreaOfLaw + "";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        if (searchRequest.SearchObject.Filters.AreaOfLaw != '') {
                            vm.previousAreaOfLawValue = searchRequest.SearchObject.Filters.AreaOfLaw;
                            searchRequest.SearchObject.Filters.AreaOfLaw = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertyPracticeGroup + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyPracticeGroup + "";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        if (searchRequest.SearchObject.Filters.PracticeGroup != '') {
                            vm.previousPracticeGroupValue = searchRequest.SearchObject.Filters.PracticeGroup;
                            searchRequest.SearchObject.Filters.PracticeGroup = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertyMatterId + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyMatterId + "";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        if (searchRequest.SearchObject.Filters.ProjectID != '') {
                            vm.previousMatterIdValue = searchRequest.SearchObject.Filters.ProjectID;
                            searchRequest.SearchObject.Filters.ProjectID = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertyMatterName + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        searchRequest.SearchObject.Sort.Direction = 1;
                        if (searchRequest.SearchObject.Filters.Name != '') {
                            vm.previousMatterNameValue = searchRequest.SearchObject.Filters.Name;
                            searchRequest.SearchObject.Filters.Name = '';
                        }
                    } else if (property == "" + vm.configSearchContent.ManagedPropertyClientName + "") {
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        searchRequest.SearchObject.Sort.Direction = 1;
                        if (searchRequest.SearchObject.Filters.ClientName != '') {
                            vm.previousClientNameValue = searchRequest.SearchObject.Filters.ClientName;
                            searchRequest.SearchObject.Filters.ClientName = '';
                        }
                    } else {

                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        searchRequest.SearchObject.Sort.Direction = 1;
                    }
                    if (!searchRequest.SearchObject.IsUnique) {
                        searchRequest.SearchObject.IsUnique = true;
                        searchRequest.SearchObject.FilterValue = term.substring(term.indexOf(":") + 1, term.indexOf("*"));
                        searchRequest.SearchObject.UniqueColumnName = property;
                    }
                }
                if (vm.matterid === 3) {
                    searchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                    getPinnedMatters(searchRequest, function (response) {
                        searchRequest.SearchObject.SearchTerm = '';
                        if (response == "") {
                            if (bool) {
                                vm.gridOptions.data = response;
                                vm.nodata = true;
                                vm.lazyloader = true;
                            } else {
                                vm.details = response;
                                vm.nodata = false;
                                vm.filternodata = true;
                                searchRequest.SearchObject.IsUnique = false;
                                searchRequest.SearchObject.FilterValue = '';
                                searchRequest.SearchObject.UniqueColumnName = '';
                                vm.SetPreviousFilterVlaues();
                            }
                            vm.lazyloaderFilter = true;
                            vm.divuigrid = true;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        } else {
                            vm.divuigrid = true;
                            vm.nodata = false;
                            vm.lazyloaderFilter = true;
                            if (bool) {
                                vm.gridOptions.data = response;
                                vm.details = [];
                                vm.lazyloader = true;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                vm.details = response;
                                vm.filternodata = false;
                                searchRequest.SearchObject.IsUnique = false;
                                searchRequest.SearchObject.FilterValue = '';
                                searchRequest.SearchObject.UniqueColumnName = '';
                                vm.SetPreviousFilterVlaues();
                            }
                            //searchRequest.SearchObject.SearchTerm = "";
                            searchRequest.SearchObject.Sort.ByProperty = "";
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        }
                    });
                } else {
                    searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    get(searchRequest, function (response) {
                        searchRequest.SearchObject.SearchTerm = '';
                        if (response == "") {
                            if (bool) {
                                vm.gridOptions.data = response;
                                vm.nodata = true;
                            } else {
                                vm.details = response;
                                vm.nodata = false;
                                vm.filternodata = true;
                                searchRequest.SearchObject.IsUnique = false;
                                searchRequest.SearchObject.FilterValue = '';
                                searchRequest.SearchObject.UniqueColumnName = '';
                                vm.SetPreviousFilterVlaues();
                            }
                            vm.lazyloaderFilter = true;
                            vm.divuigrid = true;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        } else {
                            vm.divuigrid = true;
                            vm.nodata = false;
                            vm.lazyloaderFilter = true;
                            if (bool) {
                                vm.showMatterAsPinOrUnpin(response, searchRequest);
                                vm.details = [];
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                vm.details = response;
                                vm.filternodata = false;
                                searchRequest.SearchObject.IsUnique = false;
                                searchRequest.SearchObject.FilterValue = '';
                                searchRequest.SearchObject.UniqueColumnName = '';
                                vm.SetPreviousFilterVlaues();
                            }
                            searchRequest.SearchObject.Sort.ByProperty = "";
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        }
                    });
                }
            }
            //#endregion

            //#region Functionality to set previous values for multiple filter functionality.
            vm.SetPreviousFilterVlaues = function () {
                if (vm.previousMatterIdValue != '') {
                    searchRequest.SearchObject.Filters.ProjectID = vm.previousMatterIdValue;
                    vm.previousMatterIdValue = '';
                }
                if (vm.previousPracticeGroupValue != '') {
                    searchRequest.SearchObject.Filters.PracticeGroup = vm.previousPracticeGroupValue;
                    vm.previousPracticeGroupValue = '';
                }
                if (vm.previousMatterNameValue != '') {
                    searchRequest.SearchObject.Filters.Name = vm.previousMatterNameValue;
                    vm.previousMatterNameValue = '';
                }
                if (vm.previousClientNameValue != '') {
                    searchRequest.SearchObject.Filters.ClientName = vm.previousClientNameValue;
                    vm.previousClientNameValue = '';
                }
                if (vm.previousResponsibleAttorneyValue != '') {
                    searchRequest.SearchObject.Filters.ResponsibleAttorneys = vm.previousResponsibleAttorneyValue;
                    vm.previousResponsibleAttorneyValue = '';
                }
                if (vm.previousSubAreaOfLawValue != '') {
                    searchRequest.SearchObject.Filters.SubareaOfLaw = vm.previousSubAreaOfLawValue;
                    vm.previousSubAreaOfLawValue = '';
                }
                if (vm.previousAreaOfLawValue != '') {
                    searchRequest.SearchObject.Filters.AreaOfLaw = vm.previousAreaOfLawValue;
                    vm.previousAreaOfLawValue = '';
                }
            }
            //#endregion

            //#region Functionality to filter matters based on modifiedDate selection.
            vm.FilterModifiedDate = function (name) {
                if (vm.startDate != "" || vm.endDate != "" || vm.modStartDate != "" || vm.modStartDate != "") {
                    vm.matterdateheader = false;
                    vm.lazyloader = false;
                    vm.divuigrid = false;
                    searchRequest.SearchObject.PageNumber = 1;
                    searchRequest.SearchObject.SearchTerm = "";
                    if (name == "Modified Date") {
                        if (vm.modStartDate != undefined) {
                            if (vm.modStartDate != "") {
                                searchRequest.SearchObject.Filters.DateFilters.ModifiedFromDate = $filter('date')(vm.modStartDate, "yyyy-MM-ddT00:00:00") + "Z";
                            }
                        } else {
                            searchRequest.SearchObject.Filters.DateFilters.ModifiedFromDate = "";
                        }
                        if (vm.modEndDate != undefined) {
                            if (vm.modEndDate != "") {
                                searchRequest.SearchObject.Filters.DateFilters.ModifiedToDate = $filter('date')(vm.modEndDate, "yyyy-MM-ddT23:59:59") + "Z";
                            }
                        } else {
                            searchRequest.SearchObject.Filters.DateFilters.ModifiedToDate = "";
                        }
                        vm.moddatefilter = true;
                    }
                    if (name == "Open Date" || name == "Created Date") {
                        if (vm.startDate != undefined) {
                            if (vm.startDate != "") {
                                searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = $filter('date')(vm.startDate, "yyyy-MM-ddT00:00:00") + "Z";
                            }
                        } else {
                            searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = "";
                        }
                        if (vm.endDate != undefined) {
                            if (vm.endDate != "") {
                                searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = $filter('date')(vm.endDate, "yyyy-MM-ddT23:59:59") + "Z";
                            }
                        } else {
                            searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = "";
                        }
                        vm.opendatefilter = true;
                    }
                    if ((vm.modStartDate == undefined && vm.modEndDate == undefined) || (vm.modStartDate == "" && vm.modEndDate == "") || (vm.modStartDate == undefined && vm.modEndDate == "") || (vm.modStartDate == undefined && vm.modEndDate == "")) {
                        vm.moddatefilter = false;
                    }
                    if ((vm.startDate == undefined && vm.endDate == undefined) || (vm.startDate == "" && vm.endDate == "") || (vm.startDate == undefined && vm.endDate == "") || (vm.startDate == "" && vm.endDate == undefined)) {
                        vm.opendatefilter = false;
                    }
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    searchRequest.SearchObject.Sort.Direction = 1;
                    if (vm.matterid === 3) {
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                        getPinnedMatters(searchRequest, function (response) {
                            if (response == "") {
                                vm.gridOptions.data = response;
                                vm.lazyloader = true;
                                vm.divuigrid = true;
                                vm.nodata = true;
                                $interval(function () { vm.showSortExp(); }, 2000, 3);
                            } else {
                                vm.divuigrid = true;
                                vm.nodata = false;
                                vm.lazyloader = true;
                                vm.gridOptions.data = response;
                                $interval(function () { vm.showSortExp(); }, 2000, 3);
                            }
                        });
                    } else {
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                        get(searchRequest, function (response) {
                            if (response == "") {
                                vm.gridOptions.data = response;
                                vm.lazyloader = true;
                                vm.divuigrid = true;
                                vm.nodata = true;
                                $interval(function () { vm.showSortExp(); }, 2500, 3);
                            } else {
                                vm.divuigrid = true;
                                vm.nodata = false;
                                vm.lazyloader = true;
                                vm.gridOptions.data = response;
                                $interval(function () { vm.showSortExp(); }, 2500, 3);
                            }
                        });
                    }
                } else {
                    vm.matterdateheader = true;
                }
            }
            //#endregion

            //#region Functionality to clear all filters.
            vm.clearAllFilter = function () {

                vm.matterfilter = false;
                vm.searchTerm = '';
                searchRequest.SearchObject.Filters.Name = '';

                vm.clientfilter = false;
                vm.clientSearchTerm = '';
                searchRequest.SearchObject.Filters.ClientName = '';

                vm.attorneyfilter = false;
                vm.attorneySearchTerm = '';
                searchRequest.SearchObject.Filters.ResponsibleAttorneys = '';

                vm.practiceGroupfilter = false;
                vm.practiceGroupSearchTerm = '';
                searchRequest.SearchObject.Filters.PracticeGroup = "";

                vm.areafilter = false;
                vm.areaoflawfilter = false;
                vm.areaSearchTerm = '';
                vm.areaOfLawSearchTerm = '';
                searchRequest.SearchObject.Filters.AreaOfLaw = '';

                vm.subareafilter = false;
                vm.subAreaOfLawSearchTerm = '';
                searchRequest.SearchObject.Filters.SubareaOfLaw = '';

                vm.projectIDfilter = false;
                vm.projectIDSearchTerm = '';
                searchRequest.SearchObject.Filters.ProjectID = '';

                vm.matterdateheader = true;
                vm.matterheader = true;

                vm.moddatefilter = false;
                vm.modStartDate = '';
                vm.modEndDate = '';
                searchRequest.SearchObject.Filters.DateFilters.ModifiedFromDate = '';
                searchRequest.SearchObject.Filters.DateFilters.ModifiedToDate = '';

                vm.opendatefilter = false;
                vm.startDate = '';
                vm.endDate = '';
                searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = '';
                searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = '';

                searchRequest.SearchObject.FilterValue = '';
                searchRequest.SearchObject.IsUnique = false;
                searchRequest.SearchObject.UniqueColumnName = '';

                vm.previousMatterNameValue = '';
                vm.previousClientNameValue = '';
                vm.previousPracticeGroupValue = '';
                vm.previousResponsibleAttorneyValue = '';
                vm.previousSubAreaOfLawValue = '';
                vm.previousAreaOfLawValue = '';
                vm.previousMatterIdValue = '';
            }
            //#endregion

            //#region Clear column level filter.
            vm.clearFilters = function (property) {
                vm.matterdateheader = true;
                vm.matterheader = true;
                vm.lazyloader = false;
                vm.divuigrid = false;
                vm.nodata = false;
                vm.responseNull = false;
                vm.pagenumber = 1;
                searchRequest.SearchObject.ItemsPerPage = vm.searchResultsLength;
                searchRequest.SearchObject.PageNumber = vm.pagenumber;
                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                searchRequest.SearchObject.Sort.Direction = 1;
                if (property == vm.matterConfigContent.GridColumn5Header) {
                    if (!vm.globalSettings.isBackwardCompatible) {
                        vm.attorneySearchTerm = "";
                        searchRequest.SearchObject.Filters.ResponsibleAttorneys = "";
                        vm.attorneyfilter = false;
                        vm.previousResponsibleAttorneyValue = '';
                    }
                    else {
                        searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = "";
                        searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = "";
                        vm.startDate = "";
                        vm.endDate = "";
                        vm.dateOptions.maxDate = new Date();
                        vm.opendatefilter = false;
                    }
                }
                else if (property == vm.matterConfigContent.GridColumn6Header && !vm.globalSettings.isBackwardCompatible) {
                    vm.areaSearchTerm = "";
                    searchRequest.SearchObject.Filters.SubareaOfLaw = "";
                    vm.areafilter = false;
                    vm.previousSubAreaOfLawValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn6Header && vm.globalSettings.isBackwardCompatible) {
                    vm.projectIDSearchTerm = "";
                    searchRequest.SearchObject.Filters.ProjectID = "";
                    vm.projectIDfilter = false;
                    vm.previousMatterIdValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn1Header) {
                    vm.searchTerm = "";
                    searchRequest.SearchObject.Filters.Name = "";
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    vm.matterfilter = false;
                    vm.previousMatterNameValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn3Header && !vm.globalSettings.isBackwardCompatible) {
                    vm.clientSearchTerm = ""
                    searchRequest.SearchObject.Filters.ClientName = "";
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    vm.clientfilter = false;
                    vm.areaoflawfilter = false;
                    vm.previousClientNameValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn2Header && vm.globalSettings.isBackwardCompatible) {
                    vm.practiceGroupSearchTerm = ""
                    searchRequest.SearchObject.Filters.PracticeGroup = "";
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    vm.practiceGroupfilter = false;
                    vm.previousPracticeGroupValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn4Header) {
                    if (!vm.globalSettings.isBackwardCompatible) {
                        searchRequest.SearchObject.Filters.DateFilters.ModifiedFromDate = "";
                        searchRequest.SearchObject.Filters.DateFilters.ModifiedToDate = "";
                        vm.modStartDate = "";
                        vm.modEndDate = "";
                        vm.modDateOptions.maxDate = new Date();
                        vm.moddatefilter = false;
                    } else {
                        searchRequest.SearchObject.Filters.SubareaOfLaw = "";
                        vm.subAreaOfLawSearchTerm = "";
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        vm.subareafilter = false;
                        vm.previousSubAreaOfLawValue = '';
                    }
                }
                else if (property == vm.matterConfigContent.GridColumn3Header && vm.globalSettings.isBackwardCompatible) {
                    searchRequest.SearchObject.Filters.AreaOfLaw = "";
                    vm.areaOfLawSearchTerm = "";
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    vm.areaoflawfilter = false;
                    vm.areafilter = false;
                    vm.previousAreaOfLawValue = '';
                }
                else if (property == vm.matterConfigContent.GridColumn6Header && vm.globalSettings.isBackwardCompatible) {
                    searchRequest.SearchObject.Filters.ProjectID = "";
                    vm.projectIDSearchTerm = "";
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                    vm.ProjectID = false;
                    vm.projectIDfilter = false;
                    vm.previousMatterIdValue = '';
                }
                else {
                    searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = "";
                    searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = "";
                    vm.startDate = "";
                    vm.endDate = "";
                    vm.dateOptions.maxDate = new Date();
                    vm.opendatefilter = false;
                }
                if (vm.matterid === 3) {
                    searchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                    getPinnedMatters(searchRequest, function (response) {
                        if (response == "") {
                            vm.gridOptions.data = response;
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = true;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        } else {
                            vm.divuigrid = true;
                            vm.nodata = false;
                            vm.lazyloader = true;
                            vm.gridOptions.data = response;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        }
                    });
                } else {
                    searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    get(searchRequest, function (response) {
                        if (response == "") {
                            vm.gridOptions.data = response;
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = true;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        } else {
                            vm.divuigrid = true;
                            vm.nodata = false;
                            vm.lazyloader = true;
                            vm.gridOptions.data = response;
                            $interval(function () { vm.showSortExp(); }, 2000, 3);
                        }
                    });
                }
            }
            //#endregion

            //#region Code written for displaying types in dropdown 
            vm.Matters = [{ Id: 1, Name: "" + vm.matterConfigContent.Dropdown1Item1 + "" }, { Id: 2, Name: "" + vm.matterConfigContent.Dropdown1Item2 + "" }, { Id: 3, Name: "" + vm.matterConfigContent.Dropdown1Item3 + "" }];
            vm.ddlMatters = vm.Matters[1];
            //#endregion  

            vm.pinnedorunpinned = false;
            //#region Functionality to populate grid on selection of option for matter type dropdown changes
            vm.GetMatters = function (id) {
                vm.setWidth();
                if (!vm.pinnedorunpinned) {
                    vm.selected = "";
                    vm.searchTerm = "";
                    vm.searchClientTerm = "";
                    vm.startDate = "";
                    vm.endDate = "";
                    vm.lazyloader = false;
                    vm.divuigrid = false;
                    vm.gridOptions.data = [];
                    var pinnedMattersRequest = {
                        Url: configs.global.repositoryUrl
                    }
                    vm.clearAllFiltersofSort();
                }
                if (id == 1) {
                    if (!vm.pinnedorunpinned) {
                        vm.pagenumber = 1;
                        vm.responseNull = false;
                        searchRequest.SearchObject.PageNumber = 1;
                        searchRequest.SearchObject.SearchTerm = "";
                        searchRequest.SearchObject.Filters.FilterByMe = 0;
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyMatterName + "";
                        searchRequest.SearchObject.Sort.ByColumn = "MatterName";
                        searchRequest.SearchObject.Sort.Direction = 0;
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                        vm.sortby = "asc";
                        vm.sortexp = "matterName";
                        vm.MatterNameSort = "desc";
                    }
                    get(searchRequest, function (response) {
                        if (response == "" || response.length == 0) {
                            vm.gridOptions.data = response;
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = true;
                        } else {
                            searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                            getPinnedMatters(searchRequest, function (pinnedResponse) {
                                if (pinnedResponse && pinnedResponse.length > 0) {
                                    angular.forEach(pinnedResponse, function (pinobj) {
                                        angular.forEach(response, function (res) {
                                            //Check if the pinned matter name is equal to search matter name
                                            if (pinobj.matterName == res.matterName) {
                                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                    res.MatterInfo = "Unpin this matter";
                                                    res.ismatterdone = true;
                                                }
                                            }
                                        });
                                    });
                                    vm.gridOptions.data = response;
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                } else {
                                    vm.gridOptions.data = response;
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            });
                            vm.nodata = false;
                        }

                        $timeout(function () {
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                        }, 1000);
                        $interval(function () { vm.showSortExp(); }, 2000, 3);
                    });
                } else if (id == 2) {
                    vm.lazyloader = false;
                    vm.divuigrid = false;
                    if (!vm.pinnedorunpinned) {
                        vm.pagenumber = 1;
                        vm.responseNull = false;
                        searchRequest.SearchObject.PageNumber = 1;
                        searchRequest.SearchObject.SearchTerm = "";
                        searchRequest.SearchObject.Filters.FilterByMe = 1;
                        searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                        searchRequest.SearchObject.Sort.ByColumn = "MatterModifiedDate";
                        searchRequest.SearchObject.Sort.Direction = 1;
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                        if (!vm.globalSettings.isBackwardCompatible) {
                            vm.sortby = "asc";
                            vm.sortexp = "matterModifiedDate";
                            vm.ModiFiedTimeSort = "asc";
                        }
                    }
                    get(searchRequest, function (response) {
                        if (response == "" || response.length == 0) {
                            vm.gridOptions.data = response;
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = true;
                        } else {
                            searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                            getPinnedMatters(searchRequest, function (pinnedResponse) {
                                if (pinnedResponse && pinnedResponse.length > 0) {
                                    angular.forEach(pinnedResponse, function (pinobj) {
                                        angular.forEach(response, function (res) {
                                            //Check if the pinned matter name is equal to search matter name
                                            if (pinobj.matterName == res.matterName) {
                                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                    res.MatterInfo = "Unpin this matter";
                                                    res.ismatterdone = true;
                                                }
                                            }
                                        });
                                    });
                                    vm.gridOptions.data = response;
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                } else {
                                    vm.gridOptions.data = response;
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                                vm.lazyloader = true;
                                vm.divuigrid = true;
                                vm.nodata = false;
                                forExpandingGridMenu();
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    $interval(function () { vm.showSortExp(); }, 2000, angular.element(".ui-grid-canvas").css('visibility') != 'hidden');
                                }
                            });
                        }
                    });
                } else if (id == 3) {
                    vm.lazyloader = false;
                    vm.divuigrid = false;
                    if (!vm.pinnedorunpinned) {
                        var pinnedMattersRequest = {
                            Url: configs.global.repositoryUrl
                        }
                        searchRequest.SearchObject.Sort.ByColumn = '';
                        searchRequest.SearchObject.Sort.ByProperty = '';
                        searchRequest.SearchObject.Sort.Direction = 0;
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    }
                    getPinnedMatters(searchRequest, function (response) {
                        if (response == "" || response.length == 0) {
                            vm.gridOptions.data = response;

                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = true;
                        } else {
                            angular.forEach(response, function (res) {
                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                    res.MatterInfo = "Unpin this matter";
                                    res.ismatterdone = true;
                                }
                            });
                            vm.gridOptions.data = response;
                            vm.lazyloader = true;
                            vm.divuigrid = true;
                            vm.nodata = false;
                        }
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    });
                }
            }
            //#endregion

            //#region To run GetMatters function on page load
            vm.SetMatters( vm.matterid, vm.mattername);
            //End 

            //#region Written for unpinning the matter 
            vm.UnpinMatter = function (data) {
                jQuery("#jquery-a11yfy-assertiveannouncer").empty()
                vm.pinnedorunpinned = true;
                vm.lazyloader = false;
                vm.divuigrid = false;
                var alldata = data.entity;
                var unpinRequest = {
                    Client: {
                        Url: configs.global.repositoryUrl
                    },
                    matterData: {
                        matterName: alldata.matterUrl,
                    }
                }
                UnpinMatters(unpinRequest, function (response) {
                    if (response.isMatterUnPinned) {
                        jQuery.a11yfy.assertiveAnnounce(data.entity.matterName + ' unpinned successfully');
                        $timeout(function () { vm.GetMatters(vm.matterid); $interval(function () { vm.showSortExp(); }, 5000, 3); }, 500);
                    }
                });
            }
            //#endregion

            //#region Functionality for pinning the matter.
            vm.PinMatter = function (data) {
                jQuery("#jquery-a11yfy-assertiveannouncer").empty()
                vm.pinnedorunpinned = true;
                vm.lazyloader = false;
                vm.divuigrid = false;
                var alldata = data.entity;
                var pinRequest = {
                    Client: {
                        Url: configs.global.repositoryUrl
                    },
                    matterData: {
                        matterName: alldata.matterName,
                        matterDescription: alldata.matterDescription,
                        matterCreatedDate: alldata.matterCreatedDate,
                        matterUrl: alldata.matterUrl,
                        matterPracticeGroup: alldata.matterPracticeGroup,
                        matterAreaOfLaw: alldata.matterAreaOfLaw,
                        matterSubAreaOfLaw: alldata.matterSubAreaOfLaw,
                        matterClientUrl: alldata.matterClientUrl,
                        matterClient: alldata.matterClient,
                        matterClientId: alldata.matterClientId,
                        hideUpload: alldata.hideUpload,
                        matterID: alldata.matterID,
                        matterResponsibleAttorney: alldata.matterResponsibleAttorney,
                        matterModifiedDate: alldata.matterModifiedDate,
                        matterGuid: alldata.matterGuid
                    }
                }
                PinMatters(pinRequest, function (response) {
                    if (response.isMatterPinned) {
                        jQuery.a11yfy.assertiveAnnounce(data.entity.matterName + ' pinned successfully');
                        $timeout(function () { vm.GetMatters(vm.matterid); $interval(function () { vm.showSortExp(); }, 5000, 3); }, 500);
                    }
                });
            }
            //#endregion

            //#region To display modal up in center of the screen..
            vm.reposition = function () {
                var modal = $(this)

                var dialog = modal.find('.modal-dialog');
                modal.css('display', 'block');
                // Dividing by two centers the modal exactly, but dividing by three  
                // or four works better for larger screens. 
                dialog.css("margin-top", Math.max(0, (jQuery(window).height() - dialog.height()) / 2));
            }
            // Reposition when a modal is shown
            jQuery('.modal').on('show.bs.modal', vm.reposition);
            // Reposition when the window is resized 
            jQuery(window).on('resize', function () {
                jQuery('.modal:visible').each(vm.reposition);
            });

            $timeout(vm.reposition(), 100);
            //#endregion 

            //#region For making menu visbible and hide
            vm.menuClick = function () {
                var oAppMenuFlyout = $(".AppMenuFlyout");
                if (!(oAppMenuFlyout.is(":visible"))) {
                    //// Display the close icon and close the fly out 
                    $(".OpenSwitcher").addClass("hide");
                    $(".CloseSwitcher").removeClass("hide");
                    $(".MenuCaption").addClass("hideMenuCaption");
                    oAppMenuFlyout.slideDown();
                } else {
                    oAppMenuFlyout.slideUp();
                    $(".CloseSwitcher").addClass("hide");
                    $(".OpenSwitcher").removeClass("hide");
                    $(".MenuCaption").removeClass("hideMenuCaption");
                }
            }
            //#endregion

            $rootScope.breadcrumb = true;
            $rootScope.foldercontent = false;

            vm.hideBreadCrumb = function () {
                $rootScope.breadcrumb = true;
                $rootScope.foldercontent = false;
            }

            //#region For declaring modifiedstartdate and modifiedenddate variable.
            vm.modDateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            };

            vm.modEndDateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            }

            $scope.$watch('vm.modStartDate', function (newval, oldval) {
                vm.modEndDateOptions.minDate = newval;
            });
            //#endregion

            //#region Functionality to get results on change modified date.
            vm.changeOnModifiedDate = function ($event) {
                if ($event.keyCode == '13' || $event.keyCode == '9') {

                    var modelValue = $event.target.attributes['ng-model'].value;

                    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test($event.target.value)) {
                        if (modelValue == 'vm.modStartDate') {
                            vm.modStartDate = new Date();
                            $event.target.value = vm.modStartDate;
                        } else {
                            vm.modEndDate = new Date();
                            $event.target.value = vm.modEndDate;
                        }
                    }
                    else {
                        var parts = $event.target.value.split("/");
                        var day = parseInt(parts[1], 10);
                        var month = parseInt(parts[0], 10);
                        var year = parseInt(parts[2], 10);

                        if (modelValue == 'vm.modStartDate') {
                            if (vm.modEndDate !== '' && new Date(year, month - 1, day) > vm.modEndDate) {
                                vm.modStartDate = vm.modEndDate;
                                vm.modDateOptions.maxDate = vm.modStartDate;
                            }
                            else if (new Date(year, month - 1, day) > vm.modDateOptions.maxDate && new Date(year, month - 1, day) <= new Date()) {
                                vm.modStartDate = new Date(year, month - 1, day);
                                vm.modEndDate = vm.modStartDate;
                                vm.modDateOptions.maxDate = vm.modStartDate;
                            } else if (new Date(year, month - 1, day) > new Date() && vm.modDateOptions.maxDate <= new Date()) {
                                vm.modStartDate = vm.modDateOptions.maxDate;
                                $event.target.value = vm.modStartDate;
                            } else if (new Date(year, month - 1, day) > new Date()) {
                                vm.modStartDate = new Date();
                                vm.modDateOptions.maxDate = vm.modStartDate;
                                $event.target.value = vm.modStartDate;
                            }
                        } else if (modelValue == 'vm.modEndDate' && new Date(year, month - 1, day) > new Date()) {
                            vm.modEndDate = new Date();
                            $event.target.value = vm.modEndDate;
                        }
                    }
                }
            };
            //#endregion

            //#region Functionality to open modified start date selection template.
            vm.openModStartDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                if (vm.modEndDate !== '' && vm.modEndDate !== undefined) {
                    vm.modDateOptions.maxDate = vm.modEndDate;
                }
                this.modifiedStartDate = true;
            };
            //#endregion

            //#region Functionality to open modified end date selection template.
            vm.openModEndDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                this.modifiedEndDate = true;
            };
            //#endregion

            vm.modifiedStartDate = false;
            vm.modifiedEndDate = false;

            vm.disabled = function (date, mode) {
                return (mode === 'day' && (date.getDay() != 0));
            };

            //Start for open date options
            vm.dateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            };

            //#region Functionality to get result as per selection of created date.
            vm.changeOnCreateDate = function ($event) {
                if ($event.keyCode == '13' || $event.keyCode == '9') {

                    var modelValue = $event.target.attributes['ng-model'].value;

                    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test($event.target.value)) {
                        if (modelValue == 'vm.startDate') {
                            vm.startDate = new Date();
                            $event.target.value = vm.startDate;
                        } else {
                            vm.endDate = new Date();
                            $event.target.value = vm.endDate;
                        }
                    }
                    else {
                        var parts = $event.target.value.split("/");
                        var day = parseInt(parts[1], 10);
                        var month = parseInt(parts[0], 10);
                        var year = parseInt(parts[2], 10);
                        if (modelValue == 'vm.startDate') {
                            if (vm.endDate !== '' && new Date(year, month - 1, day) > vm.endDate) {
                                vm.startDate = vm.endDate;
                                vm.dateOptions.maxDate = vm.startDate;
                            }
                            else if (new Date(year, month - 1, day) > vm.dateOptions.maxDate && new Date(year, month - 1, day) <= new Date()) {
                                vm.startDate = new Date(year, month - 1, day);
                                vm.endDate = vm.startDate;
                                vm.dateOptions.maxDate = vm.startDate;
                            }
                            else if (new Date(year, month - 1, day) > new Date() && vm.dateOptions.maxDate <= new Date()) {
                                vm.startDate = vm.dateOptions.maxDate;
                                $event.target.value = vm.startDate;
                            } else if (new Date(year, month - 1, day) > new Date()) {
                                vm.startDate = new Date();
                                vm.dateOptions.maxDate = vm.startDate;
                                $event.target.value = vm.startDate;
                            }

                        } else if (modelValue == 'vm.endDate' && new Date(year, month - 1, day) > new Date()) {
                            vm.endDate = new Date();
                            $event.target.value = vm.endDate;
                        }
                    }
                }
            };

            vm.endDateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            }

            $scope.$watch('vm.startDate', function (newval, oldval) {
                vm.endDateOptions.minDate = newval;
            });

            //#region Functionality to open start date selection template.
            vm.openStartDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                if (vm.endDate !== '' && vm.endDate !== undefined) {
                    vm.dateOptions.maxDate = vm.endDate;
                }
                this.openedStartDate = true;
            };
            //#endregion
            //#region Functionality to open end date selection template.
            vm.openEndDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                this.openedEndDate = true;
            };
            //#endregion

            vm.openedStartDate = false;
            vm.openedEndDate = false;

            //#endregion

            //#region Functionality to do filter on option selected for my and pinned or all documnets
            vm.FilterByType = function () {
                vm.lazyloader = true;
                if (vm.matterid == 3) {
                    var pinnedMattersRequest = {
                        Url: configs.global.repositoryUrl
                    }
                    searchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                    getPinnedMatters(searchRequest, function (response) {

                        if (response == "" || response.length == 0) {
                            vm.gridOptions.data = response;
                            vm.divuigrid = true;
                            vm.nodata = true;
                            $scope.errorMessage = response.message;
                        } else {
                            vm.divuigrid = true;
                            vm.nodata = false;
                            angular.forEach(response, function (res) {
                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                    res.MatterInfo = "Unpin this matter";
                                    res.ismatterdone = true;
                                }
                            });
                            vm.gridOptions.data = response;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }

                        }
                        searchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    });
                }
                else {
                    get(searchRequest, function (response) {
                        vm.lazyloader = true;
                        if (response == "" || response.errorCode == "500") {
                            vm.gridOptions.data = response;
                            vm.divuigrid = true;
                            vm.nodata = true;
                            $scope.errorMessage = response.message;
                        } else {
                            vm.showMatterAsPinOrUnpin(response, searchRequest);
                            vm.divuigrid = true;
                            vm.nodata = false;
                        }
                    });
                }
            }
            //#endregion

            //#region Custom Sorting functionality
            vm.sortby = "desc";
            vm.sortexp = "matterModifiedDate";
            vm.showSortExp = function () {
                if (vm.sortby == "asc") {
                    angular.element("#desc" + vm.sortexp).css("display", "none");
                } else {
                    angular.element("#asc" + vm.sortexp).css("display", "none");
                }
                var elm = angular.element("#" + vm.sortby + vm.sortexp);
                if (elm != undefined) {
                    elm.css("display", "block");
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
            //#endregion

            //#region Functionality to clear filter value on sorting.
            vm.clearFilterValuesOnSorting = function () {
                if (vm.matterfilter == false && vm.clientfilter == false && vm.areafilter == false &&
                    vm.areaoflawfilter == false && vm.subareafilter == false && vm.attorneyfilter == false &&
                    vm.practiceGroupfilter == false && vm.projectIDfilter == false && vm.moddatefilter == false
                     && vm.opendatefilter == false) {
                    vm.clearAllFilter();
                }
                else {
                    if (vm.matterfilter == false) {
                        vm.searchTerm = '';
                    }
                    if (vm.clientfilter == false) {
                        vm.clientSearchTerm = '';
                    }
                    if (vm.areafilter == false) {
                        vm.areaSearchTerm = '';
                    }
                    if (vm.areaoflawfilter == false) {
                        vm.areaOfLawSearchTerm = '';
                    }
                    if (vm.subareafilter == false) {
                        vm.subAreaOfLawSearchTerm = '';
                    }
                    if (vm.attorneyfilter == false) {
                        vm.attorneySearchTerm = '';
                    }
                    if (vm.practiceGroupfilter == false) {
                        vm.practiceGroupSearchTerm = '';
                    }
                    if (vm.projectIDfilter == false) {
                        vm.projectIDSearchTerm = '';
                    }
                    if (vm.moddatefilter == false) {
                        vm.modStartDate = '';
                        vm.modEndDate = '';
                        vm.modDateOptions.maxDate = new Date();
                    }
                    if (vm.opendatefilter == false) {
                        vm.startDate = '';
                        vm.endDate = '';
                        vm.dateOptions.maxDate = new Date();
                    }
                }
            }
            //#endregion

            //#region Functionality to get correct sort order for grid as per column selection.
            $scope.sortChanged = function (grid, sortColumns) {
                $timeout(function () { vm.matterdateheader = true; vm.matterheader = true; vm.lazyloader = false; }, 1);
                vm.divuigrid = false;
                vm.responseNull = false;
                vm.clearFilterValuesOnSorting();
                if (sortColumns.length != 0 && sortColumns[0] != undefined) {
                    if (sortColumns[0].name == vm.gridOptions.columnDefs[0].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.MatterNameSort == undefined || vm.MatterNameSort == "asc") {
                                vm.pagenumber = 1;
                                vm.lazyloader = false;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyMatterName + "";
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                searchRequest.SearchObject.Sort.Direction = 0;
                                vm.FilterByType();
                                vm.MatterNameSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.pagenumber = 1;
                                vm.lazyloader = false;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyMatterName + "";
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.MatterNameSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }
                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[1].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.ClientSort == undefined || vm.ClientSort == "asc") {
                                vm.pagenumber = 1;
                                vm.lazyloader = false;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyClientName + "";
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ClientSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }
                            else {
                                vm.pagenumber = 1;
                                vm.lazyloader = false;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyClientName + "";
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ClientSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }
                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[2].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.ClientIDSort == undefined || vm.ClientIDSort == "asc") {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "MCClientID";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = vm.configSearchContent.ManagedPropertyAreaOfLaw;
                                }
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ClientIDSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "MCClientID";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = vm.configSearchContent.ManagedPropertyAreaOfLaw;
                                }
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ClientIDSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }

                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[3].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.ModiFiedTimeSort == undefined || vm.ModiFiedTimeSort == "asc") {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                                }
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ModiFiedTimeSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyLastModifiedTime + "";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                                }
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ModiFiedTimeSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }

                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[4].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.ResAttoSort == undefined || vm.ResAttoSort == "asc") {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyOpenDate + "";
                                }
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ResAttoSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                if (!vm.globalSettings.isBackwardCompatible) {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "";
                                } else {
                                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyOpenDate + "";
                                }
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.ResAttoSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1500, 3);
                            }
                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[5].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.SubAreaSort == undefined || vm.SubAreaSort == "asc") {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.SubAreaSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.SubAreaSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }
                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                    else if (sortColumns[0].name == vm.gridOptions.columnDefs[6].name) {
                        if (sortColumns[0].sort != undefined) {
                            if (vm.OpenDateSort == undefined || vm.OpenDateSort == "asc") {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyOpenDate + "";
                                searchRequest.SearchObject.Sort.Direction = 0;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.OpenDateSort = "desc"; vm.sortby = "asc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            } else {
                                vm.lazyloader = false;
                                vm.pagenumber = 1;
                                searchRequest.SearchObject.PageNumber = 1;
                                searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyOpenDate + "";
                                searchRequest.SearchObject.Sort.Direction = 1;
                                searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                                vm.FilterByType();
                                vm.OpenDateSort = "asc"; vm.sortby = "desc";
                                vm.sortexp = sortColumns[0].field;
                                $interval(function () { vm.showSortExp(); }, 1200, 3);
                            }

                        } else {
                            vm.divuigrid = true;
                            $timeout(function () { vm.lazyloader = true; }, 1);
                        }
                    }
                } else {
                    vm.pagenumber = 1;
                    vm.lazyloader = false;
                    searchRequest.SearchObject.PageNumber = 1;
                    searchRequest.SearchObject.Sort.ByProperty = "" + vm.configSearchContent.ManagedPropertyMatterName + "";
                    searchRequest.SearchObject.Sort.Direction = 1;
                    searchRequest.SearchObject.Sort.ByColumn = sortColumns[0].name;
                    vm.FilterByType();
                    vm.MatterNameSort = "asc"; vm.sortby = "desc";
                    vm.sortexp = "matterName";
                    $interval(function () { vm.showSortExp(); }, 1200, 3);

                }
            }
            //#endregion

            //#region Setting the grid options when window is resized
            angular.element($window).bind('resize', function () {
                angular.element('#mattergrid .ui-grid').css('height', $window.innerHeight - 90);
                angular.element('.ui-grid-icon-menu').addClass('showExpandIcon');
                angular.element('.ui-grid-icon-menu').removeClass('closeColumnPicker');
                if ($window.innerWidth < 360) {
                    angular.element('#mattergrid .ui-grid-viewport').addClass('viewport');
                    angular.element('#mattergrid .ui-grid-viewport').removeClass('viewportlg');
                    angular.element('.ui-grid-menu-mid').css('height', $window.innerHeight - 300 + 'px !important');
                } else {
                    angular.element('#mattergrid .ui-grid-viewport').removeClass('viewport');
                    angular.element('#mattergrid .ui-grid-viewport').addClass('viewportlg');
                    angular.element('.ui-grid-menu-mid').css('height', $window.innerHeight - 300 + 'px !important');
                }
            });
            //#endregion

            //#region Functionality to get suggestions as user type search value.
            vm.typeheadselect = function (index, selected) {
                vm.clearFiltersForSearch();
                vm.lazyloader = false;
                if (vm.matterid == 3) {
                    vm.matterid = 1;
                    vm.mattername = "" + vm.matterConfigContent.Dropdown1Item1 + "";
                }
                var searchToText = '';
                var finalSearchText = '';
                if (selected != "") {

                    if (selected.lastIndexOf("(") > 0 && selected.lastIndexOf(")") == selected.length - 1) {
                        var matterName = selected.substring(0, selected.lastIndexOf("(") - 1);
                        var matterID = selected.substring(selected.lastIndexOf("("), selected.lastIndexOf(")") + 1);
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + matterName.trim() + "\" AND " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + matterID.trim() + "\")";
                    }
                    else if (selected.indexOf("(") == 0 && selected.indexOf(")") == selected.length - 1) {
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterId + ':"' + selected.trim() + '")';
                    }
                    else {
                        finalSearchText = "(" + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + selected.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + selected.trim() + "*\")";
                    }
                }
                if (vm.matterid == 2) {
                    searchRequest.SearchObject.Filters.FilterByMe = 1;
                } else {
                    searchRequest.SearchObject.Filters.FilterByMe = 0;
                }
                vm.pagenumber = 1;
                searchRequest.SearchObject.PageNumber = vm.pagenumber;
                searchRequest.SearchObject.SearchTerm = finalSearchText;
                searchRequest.SearchObject.Sort.Direction = 0;
                vm.FilterByType();
            }
            //#endregion

            //#region For showing the matters dropdown in resposive 
            vm.showmatterdrop = function ($event) {
                $event.stopPropagation();
                $rootScope.displayinfo = false;
                $rootScope.dispinner = true;
                $rootScope.contextualhelp = false;
                $rootScope.dispcontextualhelpinner = true;
                if (vm.mattersdropinner) {
                    vm.mattersdrop = true;
                    vm.mattersdropinner = false;
                } else {
                    vm.mattersdrop = false;
                    vm.mattersdropinner = true;
                }
            }
            //#endregion

            //#region For closing all the dropdowns
            vm.closealldrops = function () {
                angular.element('.zindex6').css('z-index', '6');
                vm.mattersdrop = false;
                vm.mattersdropinner = true;
                vm.matterheader = true;
                vm.matterdateheader = true;
                angular.element('.ui-grid-icon-menu').addClass('showExpandIcon');
                angular.element('.ui-grid-icon-menu').removeClass('closeColumnPicker');
            }
            //#endregion

            //#region Api call to get content check configurations
            function getContentCheckConfigurations(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getDefaultMatterConfigurations',
                    data: options,
                    success: callback
                });
            }
            //#endregion
            //#region Functionality to get content check configurations
            vm.getContentCheckConfigurations = function (siteCollectionPath) {
                siteCollectionPath = JSON.stringify(siteCollectionPath);
                getContentCheckConfigurations(siteCollectionPath, function (response) {
                    if (!response.isError) {
                        var defaultMatterConfig = JSON.parse(response.code);
                        vm.oUploadGlobal.bAllowContentCheck = defaultMatterConfig.IsContentCheck;
                        if (defaultMatterConfig.ShowAdditionalPropertiesDialogBox) {
                            getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                                if (!response.isError) {
                                    vm.taxonomyData = response;
                                }
                            });
                        }
                        

                    } else {
                        vm.oUploadGlobal.bAllowContentCheck = false;
                    }


                });
            }
            //#endregion

            //#region To expand and collapse the folder tree structure in upload
            vm.showSelectedFolderTree = function (folder) {
                function setActiveItem(item) {
                    if (item.children !== null) {
                        angular.forEach(item.children, function (child) {
                            if (item.parentURL !== null) {
                                if (item.active) {
                                    child.active = child.active ? false : true;
                                    if (!child.active) {
                                        setActiveItem(child);
                                    }
                                } else {
                                    child.active = false;
                                    setActiveItem(child);
                                }
                            }
                            else {
                                child.active = child.active ? false : true;
                                if (!child.active) {
                                    setActiveItem(child);
                                }
                            }
                        });
                    }

                }
                setActiveItem(folder);
            }
            //#endRegion

            //#region To do contentcheck or save as latestversion
            vm.localOverWriteDocument = function (duplicateFile, sOperation) {
                if (duplicateFile.fileType == "remotefile") {
                    if ("contentCheck" === sOperation) {
                        vm.files = [vm.oUploadGlobal.arrFiles[vm.oUploadGlobal.arrFiles.length - 1]];
                    } else {
                        vm.files = [vm.oUploadGlobal.arrFiles.pop()];
                        duplicateFile.cancel = null;
                    }

                    var nOperation = "";
                    if ("ignore" !== sOperation) {
                        switch (sOperation) {
                            case "overwrite":
                                nOperation = "0";
                                break;
                            case "append":
                                nOperation = "1";
                                break;
                            case "contentCheck":
                                nOperation = "2";
                                break;
                            case "cancelContentCheck":
                                nOperation = "3";
                                break;
                        }
                        vm.handleDesktopDrop(vm.clientRelativeUrl, vm.files, nOperation);
                    } else {
                        duplicateFile.cancel = "False";
                        if (vm.ducplicateSourceFile.length > 0) {
                            vm.ducplicateSourceFile.pop();
                        }
                    }
                }
                else if (duplicateFile.fileType == "attacheddocument") {
                    console.log("dragged attached obj");
                    console.log(duplicateFile);
                    var draggedFile = $filter("filter")(vm.allAttachmentDetails, vm.sourceFile.attachmentId)[0];
                    if ("contentCheck" === sOperation) {
                        mailOrDocUpload(vm.targetDrop, vm.sourceFile, false, true, draggedFile);

                    } else if ("overwrite" === sOperation) {

                        duplicateFile.cancel = null; vm.ducplicateSourceFile.pop();
                        mailOrDocUpload(vm.targetDrop, vm.sourceFile, true, undefined, draggedFile);
                    }
                    else if ("append" === sOperation) {

                        if (vm.sourceFile.isEmail && vm.sourceFile.isEmail === "true") {
                            mailOrDocUpload(vm.targetDrop, vm.sourceFile, true, false, draggedFile, sOperation)
                        }
                        if (vm.sourceFile.isEmail && vm.sourceFile.isEmail === "false") {
                            mailOrDocUpload(vm.targetDrop, vm.sourceFile, true, false, draggedFile, sOperation)
                        }
                        duplicateFile.cancel = null;
                    }
                    else {
                        duplicateFile.cancel = "False";
                        if (vm.ducplicateSourceFile.length > 0) {
                            vm.ducplicateSourceFile.pop();
                        }
                    }
                }
                else {
                    vm.ducplicateSourceFile = vm.ducplicateSourceFile.filter(function (item) {
                        return item.fileName !== duplicateFile.fileName;
                    });
                }
            }
            //#endRegion

            //#region Function to configure time stamp
            vm.overwriteConfiguration = function (fileName) {
                // Update the content as per the logic.
                var selectedOverwriteConfiguration = vm.globalSettings.overwriteDupliacteFileNameWithDateTimeFor.trim().toLocaleUpperCase(),
                    fileExtension = fileName.trim().substring(fileName.trim().lastIndexOf(".") + 1),
                    bAppendEnabled = false;

                switch (selectedOverwriteConfiguration) {
                    case "BOTH":
                        bAppendEnabled = true;
                        break;
                    case "DOCUMENT ONLY":
                        bAppendEnabled = "eml" === fileExtension || "msg" === fileExtension ? false : true;
                        break;
                    default:
                        bAppendEnabled = "eml" === fileExtension || "msg" === fileExtension ? true : false;
                        break;
                }
                return bAppendEnabled;
            }
            //#endRegion

            //#region Fnctionality to send notification to check content.
            vm.contentCheckNotification = function (file, isLocalUpload) {
                file.contentCheck = "contentCheck";
                file.saveLatestVersion = "False";
                file.cancel = "False";
                if (file.append) {
                    file.append = false;
                }
            }
            //#endRegion

            //#region Fnctionality to abort content check of files.
            vm.abortContentCheck = function (file, isLocalUpload) {
                "use strict";
                if (isLocalUpload) {
                    file.userCancelledContentCheckPerform = true;
                }
                file.contentCheck = null;
                file.saveLatestVersion = "True";
                file.value = file.value + "<br/><div>" + vm.uploadMessages.content_Check_Abort + "</div>";
                file.cancel = "True";
            }
            //#endRegion

            vm.closeSuccessBanner = function () {
                vm.oUploadGlobal.successBanner = false;
            }


            $scope.errorImage = function (image) {
                "use strict";
                if (image && image.iconSrc && image.iconSrc != "") {

                }
            }

            //#region For displaying and setting the position of the filters name wise
            vm.matterheader = true;
            vm.matterdateheader = true;
            vm.searchexp = "";
            vm.filtername = "";

            vm.openMatterHeader = function ($event, name) {
                vm.filternodata = false;
                vm.details = [];
                var top = 0;
                var left = 0;
                var dimensions = $event.target.getBoundingClientRect();
                if (dimensions.top == 0 && dimensions.left == 0) {
                    //Logic for touch devices
                    top = $event.clientY + 25;
                    left = $event.clientX - 165;
                    if (name === vm.matterConfigContent.GridColumn1Header ||
                            (name === vm.matterConfigContent.GridColumn5Header && !vm.globalSettings.isBackwardCompatible) ||
                            (name == vm.matterConfigContent.GridColumn7Header && !vm.globalSettings.isBackwardCompatible)) {
                        left = $event.clientX - 230;
                    }

                    if ((name === vm.matterConfigContent.GridColumn2Header && vm.globalSettings.isBackwardCompatible) ||
                            (name === vm.matterConfigContent.GridColumn4Header && vm.globalSettings.isBackwardCompatible)) {
                        left = $event.clientX - 180;
                    }
                    if (name === vm.matterConfigContent.GridColumn6Header && vm.globalSettings.isBackwardCompatible) {
                        left = $event.clientX - 175;
                    }
                }
                else {
                    //Logic if we use mouse
                    top = dimensions.top + 30;
                    left = dimensions.left - 224;
                }
                angular.element('.matterheader').css({
                    'top': top, 'left': left
                });
                angular.element('.matterheaderdates').css({
                    'top': top, 'left': left
                });

                vm.clearFilterValuesOnSorting();

                if (name === vm.matterConfigContent.GridColumn1Header) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertyMatterName + "";
                    vm.filtername = vm.matterConfigContent.GridColumn1Header;
                    $timeout(function () { angular.element('#matMatterName').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn3Header && !vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertyClientName + "";
                    vm.filtername = vm.matterConfigContent.GridColumn3Header;
                    $timeout(function () { angular.element('#matMatterClientName').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn2Header && vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertyPracticeGroup + "";
                    vm.filtername = vm.matterConfigContent.GridColumn2Header;
                    $timeout(function () { angular.element('#matPracticeGroup').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn3Header && vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertyAreaOfLaw + "";
                    vm.filtername = vm.matterConfigContent.GridColumn3Header;
                    $timeout(function () { angular.element('#matAreaLaw').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn5Header) {
                    if (!vm.globalSettings.isBackwardCompatible) {
                        vm.searchexp = "" + vm.configSearchContent.ManagedPropertyResponsibleAttorney + "";
                        vm.filtername = vm.matterConfigContent.GridColumn5Header;
                    }
                    else {
                        vm.filtername = vm.matterConfigContent.GridColumn5Header;
                    }
                    $timeout(function () { angular.element('#matRespAttorney').focus() }, 1000);
                }
                //AOL
                if (name === vm.matterConfigContent.GridColumn6Header && !vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                    vm.filtername = vm.matterConfigContent.GridColumn6Header;
                    $timeout(function () { angular.element('#matSubAreaLaw').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn6Header && vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertyMatterId + "";
                    vm.filtername = vm.matterConfigContent.GridColumn6Header;
                    $timeout(function () { angular.element('#matMatterId').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn4Header && vm.globalSettings.isBackwardCompatible) {
                    vm.searchexp = "" + vm.configSearchContent.ManagedPropertySubAreaOfLaw + "";
                    vm.filtername = vm.matterConfigContent.GridColumn4Header;
                    $timeout(function () { angular.element('#matSubAreaLaw').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn7Header) {
                    vm.filtername = vm.matterConfigContent.GridColumn7Header;
                    $timeout(function () { angular.element('#matOpenCreatedDate').focus() }, 1000);
                }
                if (name === vm.matterConfigContent.GridColumn4Header && !vm.globalSettings.isBackwardCompatible) {
                    vm.filtername = vm.matterConfigContent.GridColumn4Header;
                    $timeout(function () { angular.element('#matModifiDate').focus() }, 1000);
                }
                vm.dateOptions.maxDate = new Date();
                vm.modDateOptions.maxDate = new Date();
                $timeout(function () {
                    if (name == vm.matterConfigContent.GridColumn4Header && !vm.globalSettings.isBackwardCompatible
                        || name == vm.matterConfigContent.GridColumn7Header && !vm.globalSettings.isBackwardCompatible
                        || name == vm.matterConfigContent.GridColumn5Header && vm.globalSettings.isBackwardCompatible) {
                        vm.matterdateheader = false;
                    }
                    else {
                        vm.matterheader = false;
                    }
                },
                500);
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
            //#endregion

            //#region Filtering the values as per the matter name
            vm.filtermatter = function (value) {
                var searchTerm = "";
                if (vm.filtername == vm.matterConfigContent.GridColumn1Header) {
                    searchTerm = vm.searchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn3Header && !vm.globalSettings.isBackwardCompatible) {
                    searchTerm = vm.clientSearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn2Header && vm.globalSettings.isBackwardCompatible) {
                    searchTerm = vm.practiceGroupSearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn5Header) {
                    searchTerm = vm.attorneySearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn6Header && !vm.globalSettings.isBackwardCompatible) {
                    searchTerm = vm.areaSearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn6Header && vm.globalSettings.isBackwardCompatible) {
                    searchTerm = vm.projectIDSearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn3Header && vm.globalSettings.isBackwardCompatible) {
                    searchTerm = vm.areaOfLawSearchTerm.toLowerCase();
                }
                else if (vm.filtername == vm.matterConfigContent.GridColumn4Header) {
                    searchTerm = vm.subAreaOfLawSearchTerm.toLowerCase();
                }

                var arrayItem = [];
                arrayItem.push(value);
                var arrelements = [];
                angular.forEach(arrayItem, function (item) {
                    var lowerItem = item.toLowerCase();
                    if (-1 !== lowerItem.indexOf(searchTerm)) {
                        arrelements.push(item);
                    }
                });
                return arrelements.toString();
            }
            //#endregion

            //#region For opening view matters url in new window
            vm.viewMatterDetails = function (url, guid) {
                var viewmatterurl = url + '/SitePages/' + guid + '.aspx';
                window.open(viewmatterurl, 'viewmatterwindow', 'toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes,width=650,height=500')
            }
            //#endregion

            $rootScope.$on('disableOverlay', function (event, data) {
                vm.lazyloader = true;
            });

            //#region accessibility bug fixses
            //keycode 13 for enterkey
            //keycode 9 for tab
            //keycode 38 up arrow and 40 for down arrow
            //keycode 27 for esc key
            //to handle enter key press event on the ECB menu for accessibility issue fix
            vm.openContextMenu = function (event, currentRow) {
                if (event.keyCode === 13) {
                    $('.popcontent').css('display', 'none');
                    angular.element($(event.currentTarget.children[0])).addClass('open');
                    vm.checkUrlExists(currentRow)
                }
                else if (event.keyCode != 38 && event.keyCode != 40 && event.keyCode != 9) {
                    angular.element($(event.currentTarget.children[0])).removeClass('open');
                }
            }

            //to handle enter key press event to display matter flyout menu for accessibility issue fix
            vm.openMatterFlyout = function (event) {
                if (event.keyCode === 13) {
                    angular.element($(event.currentTarget.children[0])).click();
                }
                else if (event.keyCode != 38 && event.keyCode != 40 && event.keyCode != 9) {
                    $('.popcontent').css('display', 'none');
                }
            }
            //Generic function to handle Accessability Fixes for KeyBoard Navigation
            vm.mattersCombobox = function (event, id) {
                if (event.keyCode == 13) {
                    angular.element('#comboMattersOpt').addClass("open");
                }
                else if (id == 3 && event.keyCode == 9) {
                    angular.element('#comboMattersOpt').removeClass('open');
                }
                else if (event.keyCode == 27) {
                    angular.element('#comboMattersOpt').removeClass('open');
                }
            }

            vm.keydownFunction = function (event, funcName, currentRow) {
                if (event.keyCode != 38 && event.keyCode != 40 && event.keyCode != 9) {                    
                    angular.element($(event.currentTarget.parentElement.parentElement.parentElement)).removeClass('open');
                    $scope.gridApi.selection.unSelectRow(vm.currentRow);
                    jQuery.a11yfy.assertiveAnnounce("Collapsing matter search results context menu ");
                }
                switch (funcName.toLowerCase()) {
                    //If the user clicks on upload link with in the ECB menu  and presses Enter key
                    case 'upload': {
                        if (vm.hideUpload) {
                            if (event.keyCode === 13) {
                                jQuery.a11yfy.assertiveAnnounce("upload to matter modal is getting openend");
                                vm.Openuploadmodal(currentRow.matterName, currentRow.matterClientUrl, currentRow.matterGuid);
                                jQuery.a11yfy.assertiveAnnounce("upload to matter modal is openend");
                            }
                        }
                        break;
                    }
                        //If the user clicks on matteronenoteurl link with in the ECB menu and presses Enter key
                    case 'matteronenoteurl': {
                        if (event.keyCode === 13) {
                            $window.open(event.currentTarget.children[0].href, "_blank");
                        }
                        break;
                    }
                        //If the user clicks on viewmatterdetails link with in the ECB menu and presses Enter key
                    case 'viewmatterdetails': {
                        if (event.keyCode === 13) {
                            vm.viewMatterDetails(currentRow.matterClientUrl, currentRow.matterGuid)
                        }
                        break;
                    }
                        //If the user clicks on pinorunpin link with in the ECB menu  and presses Enter key
                        //If the user presses tab for the last menu, we need to close the ECB menu
                    case 'pinorunpin': {
                        if (event.keyCode === 13) {
                            currentRow.entity.MatterInfo === undefined ? vm.PinMatter(currentRow) : vm.UnpinMatter(currentRow);

                        } else if (event.keyCode === 9 ) {                           
                            angular.element($(event.currentTarget.parentElement.parentElement.parentElement)).removeClass('open');
                            jQuery.a11yfy.assertiveAnnounce("Collapsing matter search results context menu ");
                        }
                        break;
                    }

                }

                
            }
            //#endregion

            //#region For clearing search on filter.
            vm.clearFiltersForSearch = function () {
                vm.attorneySearchTerm = "";
                searchRequest.SearchObject.Filters.ResponsibleAttorneys = "";
                vm.attorneyfilter = false;
                searchRequest.SearchObject.Filters.DateFilters.OpenDateFrom = "";
                searchRequest.SearchObject.Filters.DateFilters.OpenDateTo = "";
                vm.startDate = "";
                vm.endDate = "";
                vm.opendatefilter = false;
                vm.areaSearchTerm = "";
                searchRequest.SearchObject.Filters.SubareaOfLaw = "";
                vm.areafilter = false;
                vm.projectIDSearchTerm = "";
                searchRequest.SearchObject.Filters.ProjectID = "";
                vm.projectIDfilter = false;
                vm.searchTerm = "";
                searchRequest.SearchObject.SearchTerm = "";
                searchRequest.SearchObject.Filters.Name = "";
                vm.matterfilter = false;
                vm.clientSearchTerm = ""
                searchRequest.SearchObject.Filters.ClientName = "";
                vm.clientfilter = false;
                vm.areaoflawfilter = false;
                vm.practiceGroupSearchTerm = ""
                searchRequest.SearchObject.Filters.PracticeGroup = "";
                vm.practiceGroupfilter = false;
                searchRequest.SearchObject.Filters.DateFilters.ModifiedFromDate = "";
                searchRequest.SearchObject.Filters.DateFilters.ModifiedToDate = "";
                vm.modStartDate = "";
                vm.modEndDate = "";
                vm.moddatefilter = false;
                vm.subAreaOfLawSearchTerm = "";
                vm.subareafilter = false;
                searchRequest.SearchObject.Filters.AreaOfLaw = "";
                vm.areaOfLawSearchTerm = "";
                vm.ProjectID = false;
            }
            //#endregion
            angular.element('#menuitem-1').dblclick(function (e) {
                e.preventDefault();
            });

            vm.pageLoadCompleted = function () {
                jQuery.a11yfy.assertiveAnnounce("Matters search page loaded successfully");
            }



            function cleanArray(actual) {
                var newArray = new Array();
                for (var i = 0; i < actual.length; i++) {
                    if (actual[i] && actual[i] != "") {
                        newArray.push(actual[i]);
                    }
                }
                return newArray;
            }

            //#region for additional matter properties
             vm.addtionalPropertiesAvaialbleForMatter = false;
            //#region function to get content type name from the term
            function getAdditionalContentTypeName() {
                vm.addtionalPropertiesAvaialbleForMatter = false;
                vm.matterExtraPropertiesValues =null;
                var getExtraMatterProp = false;
                var levels = vm.taxonomyData.levels;
                var termData = vm.taxonomyData.level1;
                angular.forEach(termData, function (levelOneTerm) {
                    var practiceGroupItem = vm.currentRow.matterPracticeGroup.split(";");
                    practiceGroupItem = cleanArray(practiceGroupItem);
                    for (var i = 0; i < practiceGroupItem.length; i++) {
                        if (levelOneTerm.termName.trim().toLowerCase() == practiceGroupItem[i].trim().toLowerCase()) {
                            angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {
                                var areaOfLawItem = vm.currentRow.matterAreaOfLaw.split(";");
                                areaOfLawItem = cleanArray(areaOfLawItem);
                                for (var j = 0; j < areaOfLawItem.length; j++) {
                                    if (levelTwoTerm.termName.trim().toLowerCase() == areaOfLawItem[j].trim().toLowerCase()) {
                                        angular.forEach(levelTwoTerm.level3, function (levelThreeTerm) {
                                            if (levels == 3) {
                                                if (levelThreeTerm.termName.trim().toLowerCase() == vm.currentRow.matterDefaultContentType.trim().toLowerCase()) {
                                                    getExtraMatterProp = IsCustomPropertyPresentInTerm(levelThreeTerm);
                                                }

                                            } else if (levels == 4) {
                                                angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                                    if (levelFourTerm.termName.trim().toLowerCase() == vm.currentRow.matterDefaultContentType.trim().toLowerCase()) {
                                                        getExtraMatterProp = IsCustomPropertyPresentInTerm(levelFourTerm);
                                                    }
                                                });
                                            }
                                            else if (levels == 5) {
                                                angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                                    angular.forEach(levelFourTerm.level5, function (levelFiveTerm) {
                                                        if (levelFiveTerm.termName.trim().toLowerCase() == vm.currentRow.matterDefaultContentType.trim().toLowerCase()) {
                                                            getExtraMatterProp = IsCustomPropertyPresentInTerm(levelFiveTerm);
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                   
                });
                vm.addtionalPropertiesAvaialbleForMatter = getExtraMatterProp;
                return getExtraMatterProp;
            }
            //function to get the contenttype name from the term customproperty
            vm.matterProvisionExtraPropertiesContentTypeName = "";
            function IsCustomPropertyPresentInTerm(data) {
                var additionalMatterPropSettingName = configs.taxonomy.matterProvisionExtraPropertiesContentType;
                if (data[additionalMatterPropSettingName] && data[additionalMatterPropSettingName] != "") {
                    vm.matterProvisionExtraPropertiesContentTypeName = data[additionalMatterPropSettingName];
                    return true;
                }
                else {
                    return false;
                }
            }


            //API call to retrieve matter extra properties.
            function getmatterprovisionextraproperties(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getmatterprovisionextraproperties',
                    data: options,
                    success: callback
                });
            }

           
            // this function will get additional matter properties that needs to be displayed for the users to be override 
            // when the document is getting uploaded.  
            function getAdditionalMatterProperties() {
                var extraMatterPropertiesAvailableForMatter = getAdditionalContentTypeName();
                if (extraMatterPropertiesAvailableForMatter) {
                    var additionalMatterPropSettingName = vm.matterProvisionExtraPropertiesContentTypeName;
                    var optionsForGetmatterprovisionextraproperties = {
                        Client: {
                            Url: vm.selectedRow.matterClientUrl,
                            Name: vm.selectedRow.matterName
                        },
                        MatterExtraProperties: {
                            ContentTypeName: additionalMatterPropSettingName
                        }
                    }
                    getmatterprovisionextraproperties(optionsForGetmatterprovisionextraproperties, function (result) {
                        console.log(result);
                        vm.matterExtraFields = result.Fields;
                        for (var i = 1; i <= vm.matterExtraFields.length; i++) {
                            var order = (i % 2 == 0) ? 2 : 1;
                            vm.matterExtraFields[i - 1].columnPosition = order;                           
                        }
                        getFolderHierarchyApi();
                        console.log(vm.matterExtraFields);
                    });
                }
            }


            // To set additional matter properties to sent to the server for saving
            function setAdditionalMatterPropertiesFieldsData() {
                var Fields = [];
                angular.forEach(vm.matterExtraFields, function (input) {
                    var field = { FieldDisplayName: "", FieldName: "", Type: "", FieldValue: "", IsDisplayInUI: "true" }
                    field.FieldDisplayName = input.name;
                    field.FieldName = input.fieldInternalName;
                    field.Type = input.type;
                    field.IsDisplayInUI = input.displayInUI.toString();
                    if (input.type == "Dropdown") {
                        if (input.value == undefined || input.value.choiceValue == null || input.value.choiceValue == undefined) {
                            field.FieldValue = ""
                        }
                        else {
                            field.FieldValue = input.value.choiceValue
                        }
                    } else if (input.type == "MultiChoice") {
                        field.FieldValue = "";
                        if (input.value != undefined) {
                            angular.forEach(input.value, function (val) {
                                if (val.choiceValue == null || val.choiceValue == undefined) {
                                    val.choiceValue = "";
                                }
                                field.FieldValue += field.FieldValue == "" ? val.choiceValue : "," + val.choiceValue;
                            });
                        }
                    } else {
                        if (input.value == null || input.value == undefined) {
                            input.value = "";
                        }
                        field.FieldValue = input.value;
                    }
                    if (-1 == Fields.indexOf(field)) {
                        Fields.push(field);
                    }
                });
                return Fields;
            }

            //#endregion
            //#region for grid menu
            function forExpandingGridMenu() {
                $interval(function () {
                    var elem = $($('.ui-grid-icon-container')[0]);
                    elem.attr("title", "grid menu")
                    elem.on("focus", function () {
                        jQuery.a11yfy.assertiveAnnounce("use shift enter key to expand grid menu");
                    });

                }, 5000);
            }
            //#endregion

        }]);

    //#region For adding custom filter 
    app.filter('unique', function () {
        return function (collection, keyname) {
            var output = [],
                keys = [];

            angular.forEach(collection, function (item) {
                var key = item[keyname];
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                    output.push(item);
                }
            });
            return output;
        };
    });
    //#endregion
})();