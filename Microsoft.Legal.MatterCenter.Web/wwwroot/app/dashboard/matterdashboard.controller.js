﻿(function () {
    'use strict;'
    var app = angular.module("matterMain");
    app.controller('MatterDashBoardController', ['$scope', '$state', '$interval', '$stateParams', 'api', '$timeout', 'matterDashBoardResource', '$rootScope', 'uiGridConstants', '$location', '$http', '$q', '$filter', 'commonFunctions', '$window', 'adalAuthenticationService', '$anchorScroll',
        function matterDashBoardController($scope, $state, $interval, $stateParams, api, $timeout, matterDashBoardResource, $rootScope, uiGridConstants, $location, $http, $q, $filter, commonFunctions, $window, adalService, $anchorScroll) {
            //#region For declaring variables.
            var vm = this;
            vm.selectedRow = {
                matterClientUrl: '',
                matterName: '',
                matterGuid: ''
            };
            vm.isTeamNamePresent = false;
            vm.clientNameSelected = "";
            vm.practiceGroupSelected = "";
            vm.downwarddrop = true;
            vm.upwarddrop = false;
            vm.loadLocation = false;
            vm.AuthornoResults = false;
            vm.clientdrop = false;
            vm.clientdropvisible = false;
            vm.pgdrop = false;
            vm.pgdropvisible = false;
            vm.configsUri = configs.uri;
            vm.configSearchContent = configs.search;
            vm.center = configs.search.Schema.toLowerCase();
            vm.matterDashboardConfigs = uiconfigs.MatterDashboard;
            vm.uploadMessages = uiconfigs.uploadMessages;
            vm.matterConfigContent = uiconfigs.Matters;
            vm.globalSettings = configs.global;
            sortPropertyForAllMatters = configs.search.ManagedPropertyMatterName;
            vm.aoldrop = false;
            vm.aoldropvisible = false;
            vm.checkClient = false;
            vm.sortbydrop = false;
            vm.sortbydropvisible = false;
            vm.searchText = '';
            vm.lazyloaderdashboard = true;
            vm.lazyloaderclient = true;
            vm.lazyloaderpg = true;
            vm.lazyloaderaol = true;
            vm.lazyloadersubaol = true;
            vm.totalrecords = 0;
            $rootScope.bodyclass = "bodymain";
            $rootScope.profileClass = "hide";
            $rootScope.displayOverflow = "display";
            vm.tabClicked = "My Matters";
            vm.sortbytext = vm.tabClicked == "All Matters" ? vm.matterDashboardConfigs.DropDownOptionText : vm.matterDashboardConfigs.DrpDownOption1Text;
            vm.showNavTab = false;
            vm.showInnerNav = true;
            vm.popupContainer = true;
            vm.selectedTab = vm.matterDashboardConfigs.Tab1HeaderText;

            //#endregion

            //#region Variable to show the matter count            
            vm.allMatterCount = 0;
            vm.myMatterCount = 0;
            vm.pinMatterCount = 0;
            vm.selectedTabInfo = vm.matterDashboardConfigs.Tab2HeaderText + " (" + vm.allMatterCount + ")";
            vm.Pinnedobj = [];
            vm.teamName = '';
            //#endregion           

            //#region Get Querystring values
            if ($location.search() && $location.search().teamname) {
                vm.isTeamNamePresent = true;
                angular.element("#dashboardDrop").removeClass('dashboarddrop');
                angular.element("#dashboardDrop").addClass('dashboarddropForTeam');
                angular.element("#sortColumns").css("top", "144px")
                vm.teamName = $location.search().teamname;
                vm.selectedAOLs = vm.teamName;
            }
            else {
                angular.element("#dashboardDrop").addClass('dashboarddrop');
                angular.element("#dashboardDrop").removeClass('dashboarddropForTeam');
                angular.element("#sortColumns").css("top", "80px;")
            }

            if ($location.search() && $location.search().practicegroup) {
                vm.practiceGroup = $location.search().practicegroup;
                vm.selectedPGs = vm.practiceGroup;

            }

            if ($location.search() && $location.search().mattertype) {
                vm.matterType = $location.search().mattertype;
                vm.selectedSubAOLs = vm.matterType;
            }
            //#endregion

            //#region Closing all dropdowns on click of page
            vm.closealldrops = function () {
                vm.searchdrop = false;
                vm.downwarddrop = true;
                vm.upwarddrop = false;
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
                vm.sortbydrop = false;
                vm.sortbydropvisible = false;
                vm.showNavTab = false;
                vm.showInnerNav = true;
                vm.openedStartDate = false;
                vm.openedEndDate = false;
            }
            //#endregion

            //#region Closing and hiding innerdropdowns of search box
            vm.hideinnerdrop = function ($event) {
                $event.stopPropagation();
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
                vm.subAolDropVisible = false;
                vm.subAoldrop = false;
                isOpen = false;
            }
            //#endregion

            //#region Declaring gridoption object
            var gridOptions = {
                paginationPageSize: 30,
                enableGridMenu: false,
                enableRowHeaderSelection: false,
                enableRowSelection: true,
                enableSelectAll: false,
                multiSelect: false,
                enableColumnMenus: false,
                enableFiltering: false,
                enableSorting: false
            }
            //#endregion

            //#region To get the column header name
            vm.switchFuction = function (columnName) {
                var displayColumn;
                switch (columnName) {
                    case "GridColumn1Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn1Header;
                        break;
                    case "GridColumn2Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn2Header;
                        break;
                    case "GridColumn3Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn3Header;
                        break;
                    case "GridColumn4Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn4Header;
                        break;
                    case "GridColumn5Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn5Header;
                        break;
                    case "GridColumn6Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn6Header;
                        break;
                    case "GridColumn7Header":
                        displayColumn = vm.matterDashboardConfigs.GridColumn7Header;
                        break;
                    case "GridColumn8Header":
                        displayColumn = vm.documentDashboardConfigs.GridColumn8Header;
                        break;
                    default:
                        displayColumn = '';
                        break;
                }
                return displayColumn;
            };
            //#endregion

            //#region To get the column schema and populate in column collection for grid with sorting of column display
            //Declaring column collection object. 
            // Collection requires as columns defination will be read through appsettings files and - 
            // - number of columns is dynemic (not fixed) and reduced code redundancy and easy to read and understand.
            var columnDefs1 = [];
            angular.forEach(configs.search.searchColumnsUIPickerForMatter, function (value, key) {

                if (value.displayInDashboard == true && value.position != -1) {
                    columnDefs1.push({
                        field: key,
                        displayName: vm.switchFuction(value.displayName),
                        width: value.dashboardwidth,
                        cellTemplate: value.dashboardcellTemplate,
                        position: value.position,
                        cellClass: value.dashboardCellClass,
                        headerCellClass: value.dashboardHeaderCellClass,
                        enableColumnMenu: false
                    });
                }

            });
            vm.loginUser = adalService.userInfo.userName;
            columnDefs1.push({
                field: 'pin',
                displayName: 'Pin',                
                width: '50',
                cellTemplate: '<div class="ui-grid-cell-contents pad0" ><img aria-label="This image button will allow the user to pin or unpin the matter" alt="{{row.entity.pinType}}" title="{{row.entity.pinType}}" ng-src="../Images/{{row.entity.pinType}}-666.png"  ng-click="grid.appScope.vm.pinorunpin($event, row.entity)"/></div>',
                enableColumnMenu: false,
                position: 75
            });
            //Declaring column collection object.
            columnDefs1.push({
                field: 'upload',
                displayName: 'Upload',
                width: '60',
                cellTemplate: '<div class="ui-grid-cell-contents pad0" showupload loginuser="' + vm.loginUser + '" hideupload={{row.entity.hideUpload}}><img aria-label="This image button will allow the user to upload documents to the current matter" title="upload" class="hideUploadImg" src="../Images/upload-666.png"/><img title="upload" class="showUploadImg" src="../Images/upload-666.png" ng-click="grid.appScope.vm.Openuploadmodal(row.entity.matterName,row.entity.matterClientUrl,row.entity.matterGuid)"/></div>',
                enableColumnMenu: false,
                position: 76
            });

            //Sorting the column as per appsetting columns defination.
            function getSortFunction(fieldName) {
                return function (col1, col2) {
                    return parseInt(col1[fieldName]) - parseInt(col2[fieldName]);
                }
            }
            columnDefs1.sort(getSortFunction("position"));

            //#region Matter Grid functionality
            vm.matterGridOptions = {
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: 0,
                enableSorting: false,
                paginationPageSize: gridOptions.paginationPageSize,
                enableGridMenu: gridOptions.enableGridMenu,
                enableRowHeaderSelection: gridOptions.enableRowHeaderSelection,
                enableRowSelection: gridOptions.enableRowSelection,
                enableSelectAll: gridOptions.enableSelectAll,
                multiSelect: gridOptions.multiSelect,
                enableFiltering: gridOptions.enableFiltering,
                columnDefs: columnDefs1,
                onRegisterApi: function (gridApi) {
                    vm.gridApi = gridApi;
                    //Set the selected row of the grid to selectedRow property of the controller
                    gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                        vm.selectedRow = row.entity;
                       
                    });
                }
            }
            //#endregion

            //#region API to get the client taxonomy and Practice Group taxonomy
            var optionsForClientGroup = {
                Client: {
                    Url: configs.global.repositoryUrl
                },
                TermStoreDetails: {
                    TermGroup: configs.taxonomy.termGroup,
                    TermSetName: configs.taxonomy.clientTermSetName,
                    CustomPropertyName: configs.taxonomy.clientCustomPropertiesURL,
                }
            };
            //#endregion

            //#region API to get the client taxonomy and Practice Group taxonomy

            //API call to get practice group option.
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

            //API call to get texonomy client.
            function getTaxonomyDetailsForClient(optionsForClientGroup, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getTaxonomyDetails',
                    data: optionsForClientGroup,
                    success: callback
                });
            }

            //API call to get texonomy details for client.
            function getTaxonomyDetailsForPractice(optionsForPracticeGroup, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getTaxonomyDetails',
                    data: optionsForPracticeGroup,
                    success: callback
                });
            }

            //Getting practice group data to get the content type from the data
            vm.taxonomyData = {};          

            //API call to get matter count
            function getMatterCounts(searchRequest, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getMatterCounts',
                    data: searchRequest,
                    success: callback
                });
            }
            //#endregion

            //#region API to get matters for the selected criteria and bind data to grid
            //api for matter search
            function get(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'get',
                    data: options,
                    success: callback
                });
            }

            //API to get pinned matters
            function getPinnedMatters(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getPinnedMatters',
                    data: options,
                    success: callback
                });
            }

            //Callback function for pin 
            function pinMatter(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'PinMatter',
                    data: options,
                    success: callback
                });
            }

            //Callback function for unpin 
            function unpinMatter(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'UnpinMatter',
                    data: options,
                    success: callback
                });
            }

            //Callback function to get folder Hierarchy. 
            function getFolderHierarchy(options, callback) {
                api({
                    resource: 'matterDashBoardResource',
                    method: 'getFolderHierarchy',
                    data: options,
                    success: callback
                });
            }

            //SearchRequest Object that will be filled up for different search requirements
            var jsonMatterSearchRequest = {
                Client: {
                    Url: configs.global.repositoryUrl
                },
                SearchObject: {
                    PageNumber: 1,
                    ItemsPerPage: gridOptions.paginationPageSize,
                    SearchTerm: '',
                    Filters: {
                        ClientsList: [""],
                        PGList: [""],
                        AOLList: [""],
                        FromDate: "",
                        ToDate: "",
                        FilterByMe: 0,
                        PracticeGroup: "",
                        AreaOfLaw: "",
                        SubareaOfLaw: ""
                    },
                    Sort: {
                        ByProperty: 'LastModifiedTime',
                        Direction: 1,
                        ByColumn: "",
                        SortAndFilterPinnedData: false
                    }
                }
            };

            //#endregion api calls.

            //#region To show matter as pin or unpin matter.
            vm.showMatterAsPinOrUnpin = function (response, searchRequest) {
                jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                    if (pinnedResponse && pinnedResponse.length > 0) {
                        vm.Pinnedobj = pinnedResponse;
                        vm.pinMatterCount = vm.Pinnedobj.length
                        angular.forEach(pinnedResponse, function (pinobj) {
                            angular.forEach(response, function (res) {
                                //Check if the pinned matter name is equal to search matter name
                                if (pinobj.matterName == res.matterName) {
                                    if (res.ismatterdone == undefined && !res.ismatterdone) {
                                        res.ismatterdone = true;
                                        res.pinType = "unpin"
                                    }
                                }
                            });
                        });
                    }
                    else {
                        vm.pinMatterCount = 0;
                    }
                    vm.matterGridOptions.data = response;
                    vm.getMatterCounts();
                });

            }
            //#endregion

            //#reion This function will get counts for all matters, my matters and pinned matters
            vm.getMatterCounts = function () {
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                getMatterCounts(jsonMatterSearchRequest, function (response) {
                    vm.allMatterCount = response.allMatterCounts;
                    if (!vm.searchClicked) {
                        vm.myMatterCount = response.myMatterCounts;
                        vm.pinMatterCount = response.pinnedMatterCounts;
                    }
                    if (vm.selectedTab == vm.matterDashboardConfigs.Tab1HeaderText) {
                        vm.totalrecords = response.myMatterCounts;
                    } else if (vm.selectedTab == vm.matterDashboardConfigs.Tab2HeaderText) {
                        vm.totalrecords = response.allMatterCounts;
                    } else {
                        vm.totalrecords = response.pinnedMatterCounts
                    }
                    if (vm.searchClicked) {
                        vm.totalrecords = response.allMatterCounts;
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                    if (vm.tabClicked.toLowerCase() == vm.matterDashboardConfigs.Tab1HeaderText.toLowerCase() && !vm.searchClicked) {
                        vm.selectedTabInfo = vm.matterDashboardConfigs.Tab1HeaderText + " (" + response.myMatterCounts + ")";
                    } else if (vm.tabClicked.toLowerCase() == vm.matterDashboardConfigs.Tab2HeaderText.toLowerCase()) {
                        vm.selectedTabInfo = vm.matterDashboardConfigs.Tab2HeaderText + " (" + response.allMatterCounts + ")";
                    } else if (vm.tabClicked.toLowerCase() == vm.matterDashboardConfigs.Tab3HeaderText.toLowerCase() && !vm.searchClicked) {
                        vm.selectedTabInfo = vm.matterDashboardConfigs.Tab3HeaderText + " (" + response.pinnedMatterCounts + ")";
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                    vm.pagination();
                    if (response == "" ||
                            (vm.selectedTab == vm.matterDashboardConfigs.Tab2HeaderText && response.allMatterCounts == 0) ||
                            (vm.selectedTab == vm.matterDashboardConfigs.Tab1HeaderText && response.myMatterCounts == 0 && !vm.searchClicked) ||
                            (vm.selectedTab == vm.matterDashboardConfigs.Tab3HeaderText && response.pinnedMatterCounts == 0 && !vm.searchClicked)) {
                        vm.lazyloaderdashboard = true;
                        vm.divuigrid = false;
                        vm.nodata = true;
                    } else {
                        vm.lazyloaderdashboard = true;
                        vm.divuigrid = true;
                        vm.nodata = false;
                        $timeout(function () { angular.element("#grid1").focus(); }, 1000);
                    }
                });
            }
            //#endregion

            //#region This api will get all matters which are pinned and this will be invoked when the user clicks on "Pinned Matters Tab"
            vm.getMatterPinned = function () {
                $timeout(function () { angular.element('#divLoading').focus(); }, 1000);
                vm.searchClicked = false;
                vm.matterGridOptions.data = [];
                vm.tabClicked = "Pinned Matters";
                vm.selectedTab = vm.matterDashboardConfigs.Tab3HeaderText;
                vm.sortbytext = vm.matterDashboardConfigs.DrpDownOption1Text;
                vm.pagenumber = 1;
                vm.selectedPGs = "";
                vm.selectedAOLs = "";
                vm.selectedSubAOLs = "";
                vm.selectedClients = "";
                vm.startDate = "";
                vm.endDate = "";
                vm.searchText = "";
                angular.element("input[name='practiceGroup']:checkbox").prop('checked', false);
                angular.element("input[name='clients']:checkbox").prop('checked', false);
                angular.element("input[name='areaofLaw']:checkbox").prop('checked', false);
                angular.element("input[name='subAreaofLaw']:checkbox").prop('checked', false);
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
                jsonMatterSearchRequest.SearchObject.PageNumber = vm.pagenumber;
                jsonMatterSearchRequest.SearchObject.Filters.ClientsList = [];
                jsonMatterSearchRequest.SearchObject.Filters.PracticeGroup = "";
                jsonMatterSearchRequest.SearchObject.Filters.AreaOfLaw = "";
                jsonMatterSearchRequest.SearchObject.Filters.SubareaOfLaw = "";
                jsonMatterSearchRequest.SearchObject.Filters.FromDate = "";
                jsonMatterSearchRequest.SearchObject.Filters.ToDate = "";
                jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "MatterModifiedDate";
                jsonMatterSearchRequest.SearchObject.Sort.Direction = 1;
                jsonMatterSearchRequest.SearchObject.Sort.ByColumn = "MatterModifiedDate";
                jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                var pinnedMattersRequest = {
                    Url: configs.global.repositoryUrl//ToDo: Read from config.js
                }
                getPinnedMatters(jsonMatterSearchRequest, function (response) {
                    if (response == "" || response.length == 0) {
                        jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                        jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "";
                        jsonMatterSearchRequest.SearchObject.Sort.Direction = 1;
                        jsonMatterSearchRequest.SearchObject.Sort.ByColumn = "";
                        vm.getMatterCounts();
                    }
                    else {
                        var pinnedResponse = response;
                        if (response && response.length > 0) {
                            angular.forEach(response, function (res) {
                                res.pinType = "unpin"
                            })
                        }
                        vm.Pinnedobj = response
                        vm.matterGridOptions.data = response;
                        jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                        jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "";
                        jsonMatterSearchRequest.SearchObject.Sort.Direction = 1;
                        jsonMatterSearchRequest.SearchObject.Sort.ByColumn = "";
                        vm.getMatterCounts();

                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                });
            }
            //#endregion

            //#region This earch function will be used when the user enters some text in the search text box and presses search button
            vm.searchMatters = function (val) {
                $("[uib-typeahead-popup].dropdown-menu").css("display", "block");
                var searchMattersSearchRequest = {
                    Client: {
                        Url: configs.global.repositoryUrl
                    },
                    SearchObject: {
                        PageNumber: 1,
                        ItemsPerPage: gridOptions.paginationPageSize,
                        SearchTerm: '',
                        Filters: {
                            ClientsList: [""],
                            PGList: [""],
                            AOLList: [""],
                            FromDate: "",
                            ToDate: "",
                            FilterByMe: 0,
                            PracticeGroup: "",
                            AreaOfLaw: "",
                            SubareaOfLaw: ""
                        },
                        Sort: {
                            ByProperty: 'LastModifiedTime',
                            Direction: 1,
                            ByColumn: "",
                            SortAndFilterPinnedData: false
                        }
                    }
                };
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
                vm.pagenumber = 1;
                searchMattersSearchRequest.SearchObject.PageNumber = vm.pagenumber;
                searchMattersSearchRequest.SearchObject.SearchTerm = finalSearchText;
                searchMattersSearchRequest.SearchObject.Sort.Direction = 1;
                return matterDashBoardResource.get(searchMattersSearchRequest).$promise;
            }
            //#endregion

            //#region Functionality to get suggestions as user type search value
            vm.typeheadselect = function (index, selected) {
                vm.searchClicked = true;
                vm.lazyloaderdashboard = false;
                vm.displaypagination = false;
                vm.divuigrid = false;
                vm.nodata = false;
                vm.matterid = 1;
                vm.mattername = "All Matters";
                angular.element('#allMatters').addClass("active");
                angular.element('#myMatters').removeClass("active");
                angular.element('#pinMatters').removeClass("active");
                vm.selectedTab = vm.matterDashboardConfigs.Tab2HeaderText;
                vm.pagenumber = 1;
                vm.sortbytext = vm.matterDashboardConfigs.DropDownOptionText;
                var searchToText = '';
                var finalSearchText = '';
                vm.tabClicked = vm.matterDashboardConfigs.Tab2HeaderText;
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
                vm.pagenumber = 1;
                jsonMatterSearchRequest.SearchObject.PageNumber = 1;
                jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                jsonMatterSearchRequest.SearchObject.SearchTerm = finalSearchText;
                jsonMatterSearchRequest.SearchObject.Sort.Direction = 0;
                vm.FilterByType();
            }
            //#endregion

            //#region for searching matters when entering text in serach box
            vm.searchText = "";
            vm.searchClicked = false;
            vm.searchByTerm = function () {
                
                vm.searchClicked = true;
                vm.lazyloaderdashboard = false;
                vm.displaypagination = false;
                vm.divuigrid = false;
                vm.nodata = false;
                vm.matterid = 1;
                vm.mattername = "All Matters";
                angular.element('#allMatters').addClass("active");
                angular.element('#myMatters').removeClass("active");
                angular.element('#pinMatters').removeClass("active");
                vm.selectedTab = vm.matterDashboardConfigs.Tab2HeaderText;
                vm.tabClicked == vm.matterDashboardConfigs.Tab2HeaderText;
                vm.pagenumber = 1;
                vm.sortbytext = vm.matterDashboardConfigs.DropDownOptionText;
                var searchToText = '';
                var finalSearchText = '';
                if (vm.searchText != "") {
                    if (vm.searchText.indexOf("(") > -1) {
                        searchToText = vm.searchText.replace("(", ",")
                        searchToText = searchToText.replace(")", "")
                        var firstText = searchToText.split(',')[0]
                        var secondText = searchToText.split(',')[1]
                        finalSearchText = '(' + configs.search.ManagedPropertyMatterName + ':"' + firstText.trim() + '" AND ' + configs.search.ManagedPropertyMatterId + ':"' + secondText.trim() + '")'
                    } else {
                        finalSearchText = commonFunctions.searchFilter(vm.searchText);
                    }
                }
                jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                jsonMatterSearchRequest.SearchObject.SearchTerm = finalSearchText;
                jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "LastModifiedTime";
                jsonMatterSearchRequest.SearchObject.Sort.Direction = 1;
                get(jsonMatterSearchRequest, function (response) {
                    if (response == "" || response.length == 0) {
                        vm.getMatterCounts();
                    } else {
                        vm.showMatterAsPinOrUnpin(response, jsonMatterSearchRequest);
                    }
                });
            }
            //#endregion

            //#region Functionality to get mymatters records in grid.
            vm.myMatters = function () {
                $timeout(function () { angular.element('#divLoading').focus(); }, 1000);
                vm.searchText = "";
                vm.searchClicked = false;
                vm.matterGridOptions.data = [];
                vm.tabClicked = "My Matters";
                vm.selectedTab = vm.matterDashboardConfigs.Tab1HeaderText;
                vm.sortbytext = vm.matterDashboardConfigs.DrpDownOption1Text;
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                var searchToText = '';
                var finalSearchText = '';
                if (vm.searchText != "") {
                    if (vm.searchText.indexOf("(") > -1) {
                        searchToText = vm.searchText.replace("(", ",");
                        searchToText = searchToText.replace(")", "");
                        var firstText = searchToText.split(',')[0];
                        var secondText = searchToText.split(',')[1];
                        var finalSearchText = '(' + configs.search.ManagedPropertyMatterName + ':"' + firstText.trim() + '" AND ' + configs.search.ManagedPropertyMatterId + ':"' + secondText.trim() + '")';
                    } else {
                        finalSearchText = commonFunctions.searchFilter(vm.searchText);
                    }
                }
                jsonMatterSearchRequest.SearchObject.Filters.ClientsList = [];
                jsonMatterSearchRequest.SearchObject.Filters.PracticeGroup = "";
                jsonMatterSearchRequest.SearchObject.Filters.AreaOfLaw = "";
                jsonMatterSearchRequest.SearchObject.Filters.SubareaOfLaw = "";
                jsonMatterSearchRequest.SearchObject.Filters.FromDate = "";
                jsonMatterSearchRequest.SearchObject.Filters.ToDate = "";
                jsonMatterSearchRequest.SearchObject.SearchTerm = finalSearchText;
                jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 1;
                jsonMatterSearchRequest.SearchObject.PageNumber = 1;
                jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "LastModifiedTime";
                jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                jsonMatterSearchRequest.SearchObject.ItemsPerPage = gridOptions.paginationPageSize;
                get(jsonMatterSearchRequest, function (response) {
                    if (response == "" || response.length == 0) {
                        vm.getMatterCounts();
                    }
                    else {
                        getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                            if (pinnedResponse && pinnedResponse.length > 0) {
                                vm.Pinnedobj = pinnedResponse;
                                vm.pinMatterCount = vm.Pinnedobj.length
                                angular.forEach(pinnedResponse, function (pinobj) {
                                    angular.forEach(response, function (res) {
                                        //Check if the pinned matter name is equal to search matter name
                                        if (pinobj.matterName == res.matterName) {
                                            if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                res.ismatterdone = true;
                                                res.pinType = "unpin"
                                            }
                                        }
                                    });
                                });
                                vm.matterGridOptions.data = response;
                                vm.selectedTabCount = vm.myMatterCount;
                                vm.getMatterCounts();
                            }
                            else {

                                vm.matterGridOptions.data = response;
                                vm.selectedTabCount = vm.myMatterCount;
                                vm.pinMatterCount = 0;
                                vm.getMatterCounts();
                            }
                            $timeout(function () { angular.element('#myMatters').focus(); }, 1000);
                            $anchorScroll();
                        });
                    }
                });
            }
            //#endregion

            //#region This search function will be used for binding search results to the grid
            vm.search = function (isMy) {
                $timeout(function () { angular.element('#divLoading').focus(); }, 1000);
                vm.matterGridOptions.data = [];
                vm.tabClicked = "All Matters";
                vm.selectedTab = vm.matterDashboardConfigs.Tab2HeaderText;
                vm.sortbytext = vm.matterDashboardConfigs.DropDownOptionText;
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                var searchToText = '';
                var finalSearchText = '';

                if (vm.searchText != "") {

                    if (vm.searchText.indexOf("(") == 0 && vm.searchText.indexOf(")") == vm.searchText.length - 1) {
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ':"' + vm.searchText.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyMatterId + ':"' + vm.searchText.trim() + '*" OR ' + vm.configSearchContent.ManagedPropertyClientName + ':"' + vm.searchText.trim() + '*")';
                    }
                    else if (vm.searchText.lastIndexOf("(") > 0 && vm.searchText.lastIndexOf(")") == vm.searchText.length - 1) {
                        var matterName = vm.searchText.substring(0, vm.searchText.lastIndexOf("(") - 1);
                        var matterID = vm.searchText.substring(vm.searchText.lastIndexOf("("), vm.searchText.lastIndexOf(")") + 1);
                        finalSearchText = '(' + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + matterName.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + matterID.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyClientName + ":\"" + vm.searchText.trim() + "*\")";
                    }
                    else {
                        finalSearchText = "(" + vm.configSearchContent.ManagedPropertyMatterName + ":\"" + vm.searchText.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyMatterId + ":\"" + vm.searchText.trim() + "*\" OR " + vm.configSearchContent.ManagedPropertyClientName + ":\"" + vm.searchText.trim() + "*\")"
                    }
                }

                var pinnedMattersRequest = {
                    Url: configs.global.repositoryUrl
                }
                var tempMatters = [];
                jsonMatterSearchRequest.SearchObject.SearchTerm = finalSearchText;
                jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                jsonMatterSearchRequest.SearchObject.PageNumber = 1;
                jsonMatterSearchRequest.SearchObject.Sort.ByProperty = sortPropertyForAllMatters;
                jsonMatterSearchRequest.SearchObject.Sort.Direction = 0;
                jsonMatterSearchRequest.SearchObject.ItemsPerPage = gridOptions.paginationPageSize;
                jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                get(jsonMatterSearchRequest, function (response) {
                    //We need to call pinned api to determine whether a matter is pinned or not                    
                    if (response == "" || response.length == 0) {
                        vm.getMatterCounts();
                    }
                    else {
                        getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                            if (pinnedResponse && pinnedResponse.length > 0) {
                                vm.Pinnedobj = pinnedResponse;
                                vm.pinMatterCount = vm.Pinnedobj.length
                                angular.forEach(pinnedResponse, function (pinobj) {
                                    angular.forEach(response, function (res) {
                                        //Check if the pinned matter name is equal to search matter name
                                        if (pinobj.matterName == res.matterName) {
                                            if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                res.ismatterdone = true;
                                                res.pinType = "unpin"
                                            }
                                        }
                                    });
                                });
                                vm.getMatterCounts();
                                vm.matterGridOptions.data = response;
                                vm.selectedTabCount = vm.allMatterCount;
                            }
                            else {
                                vm.getMatterCounts();
                                vm.matterGridOptions.data = response;
                                vm.selectedTabCount = vm.allMatterCount;
                                vm.pinMatterCount = 0;
                            }
                        });
                    }
                });
            }
            //#endregion

            //#region This function will pin or unpin the matter based on the image button clicked
            vm.pinorunpin = function (e, currentRowData) {
                vm.popupContainer = false;
                jQuery.a11yfy.assertiveAnnounce("Pinning matter " + currentRowData.matterName)
                if (e.currentTarget.src.toLowerCase().indexOf("images/pin-666.png") > 0) {
                    e.currentTarget.src = "../Images/loadingGreen.gif";
                    var pinRequest = {
                        Client: {
                            Url: configs.global.repositoryUrl
                        },
                        matterData: {
                            matterName: currentRowData.matterName,
                            matterDescription: currentRowData.matterDescription,
                            matterCreatedDate: currentRowData.matterCreatedDate,
                            matterUrl: currentRowData.matterUrl,
                            matterPracticeGroup: currentRowData.matterPracticeGroup,
                            matterAreaOfLaw: currentRowData.matterAreaOfLaw,
                            matterSubAreaOfLaw: currentRowData.matterSubAreaOfLaw,
                            matterClientUrl: currentRowData.matterClientUrl,
                            matterClient: currentRowData.matterClient,
                            matterClientId: currentRowData.matterClientId,
                            hideUpload: currentRowData.hideUpload,
                            matterID: currentRowData.matterID,
                            matterResponsibleAttorney: currentRowData.matterResponsibleAttorney,
                            matterModifiedDate: currentRowData.matterModifiedDate,
                            matterGuid: currentRowData.matterGuid,
                            pinType: 'unpin'
                        }
                    }
                    pinMatter(pinRequest, function (response) {
                        if (response.isMatterPinned) {
                            e.currentTarget.src = "../images/unpin-666.png";
                            e.currentTarget.title = "unpin"
                            vm.pinMatterCount = parseInt(vm.pinMatterCount, 10) + 1;
                            jQuery.a11yfy.assertiveAnnounce(currentRowData.matterName + " has pinned successfully")
                        }
                        vm.popupContainer = true;
                    });
                }
                else if (e.currentTarget.src.toLowerCase().indexOf("images/unpin-666.png") > 0) {
                    jQuery.a11yfy.assertiveAnnounce("UnPinning matter " + currentRowData.matterName)
                    e.currentTarget.src = "../Images/loadingGreen.gif";
                    var unpinRequest = {
                        Client: {
                            Url: configs.global.repositoryUrl
                        },
                        matterData: {
                            matterName: currentRowData.matterUrl,
                        }
                    }
                    unpinMatter(unpinRequest, function (response) {
                        if (response.isMatterUnPinned) {
                            jQuery.a11yfy.assertiveAnnounce(currentRowData.matterName + " has been unpinned successfully")
                            vm.pinMatterCount = parseInt(vm.pinMatterCount, 10) - 1;
                            if (vm.tabClicked.toLowerCase().indexOf("pinned") >= 0) {
                                e.currentTarget.src = "../images/unpin-666.png";
                                e.currentTarget.title = "unpin";
                                vm.matterGridOptions.data.splice(vm.matterGridOptions.data.indexOf(currentRowData), 1)
                            }
                            else {
                                e.currentTarget.src = "../images/pin-666.png";
                                e.currentTarget.title = "pin"
                            }
                            if (vm.pinMatterCount == 0) {
                                vm.nodata = true;
                                vm.displaypagination = false;
                            }
                        }
                        vm.popupContainer = true;
                    });
                }
            }
            //#endregion 

            //#region Closing and Opening searchbar dropdowns
            vm.showupward = function ($event) {
                $event.stopPropagation();
                vm.searchdrop = true;
                vm.downwarddrop = false;
                vm.upwarddrop = true;
                jQuery.a11yfy.assertiveAnnounce("Exapnding advance search section");
                $timeout(function () { angular.element('#matterClients').focus(); }, 500);
                $("[uib-typeahead-popup].dropdown-menu").css("display", "none");

            }

            vm.showdownward = function ($event) {
                $event.stopPropagation();
                vm.searchdrop = false;
                vm.upwarddrop = false;
                vm.downwarddrop = true;
                jQuery.a11yfy.assertiveAnnounce("Collapsing advance search section");
            }
            //#endregion

            //#region Showing and Hiding the sortby dropdown
            vm.showsortby = function ($event) {               
                $event.stopPropagation();
                if (!vm.sortbydropvisible) {
                    jQuery.a11yfy.assertiveAnnounce("Expanding context menu");
                    vm.sortbydrop = true;
                    vm.sortbydropvisible = true;
                    $timeout(function () { angular.element('#menuSortBy').focus() }, 500);
                } else {
                    jQuery.a11yfy.assertiveAnnounce("Collapsing context menu");
                    vm.sortbydrop = false;
                    vm.sortbydropvisible = false; 
                    $timeout(function () { angular.element('#sortIconCombo').focus() }, 500);
                }
            }
            //#endregion

            //#region For declaring startdate and enddate variable.
            vm.dateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            };

            vm.endDateOptions = {
                formatYear: 'yy',
                maxDate: new Date(),
                shortcutPropagation: true
            }

            $scope.$watch('vm.startDate', function (newval, oldval) {
                vm.endDateOptions.minDate = newval;
            });
            //#endregion

            //#region Functionality to open start date selection template.
            vm.openStartDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                if (vm.endDate !== '' && vm.endDate !== undefined) {
                    vm.dateOptions.maxDate = vm.endDate;
                }
                vm.openedStartDate = vm.openedStartDate ? false : true;
                vm.openedEndDate = false;
            };
            //#endregion

            //#region Functionality to open end date selection template.
            vm.openEndDate = function ($event) {
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }
                vm.openedEndDate = vm.openedEndDate ? false : true;
                vm.openedStartDate = false;
            };
            //#endregion

            vm.openedStartDate = false;
            vm.openedEndDate = false;

            //#region Functionality to get result as per selection of created date
            vm.changeOnCreateDate = function ($event) {
                if ($event.keyCode == '13' || $event.keyCode == '9') {
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
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
            //#endregion

            //#region showing and hiding client dropdown
            vm.showClientDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.clientdropvisible) {
                    jQuery.a11yfy.assertiveAnnounce("Expanding the clients list popup");
                    if (vm.clients === undefined) {
                        jQuery.a11yfy.assertiveAnnounce("Loading the clients");
                        vm.lazyloaderclient = false;
                        getTaxonomyDetailsForClient(optionsForClientGroup, function (response) {
                            vm.clients = response.clientTerms;
                            vm.clientdrop = true;
                            vm.clientdropvisible = true;
                            jQuery.a11yfy.assertiveAnnounce("clients list loaded");
                            if (vm.selectedClients !== undefined && vm.selectedClients.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText);
                            }
                            vm.lazyloaderclient = true;
                        });
                    }
                    else {
                        if (vm.selectedClients !== undefined && vm.selectedClients.length > 0) {
                            vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText);
                        }
                        vm.clientdrop = true;
                        vm.clientdropvisible = true;
                    }
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;

                } else if (vm.clientdropvisible && $event.type === "keyup") {
                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText);
                } else {
                    jQuery.a11yfy.assertiveAnnounce("Collapsing the clients list popup");
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.lazyloaderclient = true;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
            }
            //#endregion

            //#region showing and hiding practice group dropdown
            vm.showPracticegroupDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.pgdropvisible) {
                    jQuery.a11yfy.assertiveAnnounce("Expanding the practice group list popup");
                    if (!vm.globalSettings.isBackwardCompatible) {
                        if ((vm.practiceGroups === undefined) && (vm.aolTerms === undefined)) {
                            vm.lazyloaderpg = false;
                        jQuery.a11yfy.assertiveAnnounce("Loading the practice groups");
                            getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                                vm.practiceGroups = response.level1;
                                vm.aolTerms = [];
                                angular.forEach(response.level1, function (pgTerm) {
                                    angular.forEach(pgTerm.level2, function (areaterm) {
                                        vm.aolTerms.push(areaterm);
                                    });
                                });
                                vm.subAolTerms = [];
                                angular.forEach(response.level1, function (pgTerm) {
                                    angular.forEach(pgTerm.level2, function (areaterm) {
                                        angular.forEach(areaterm.level3, function (term) {
                                            vm.subAolTerms.push(term);
                                        });
                                    });
                                });
                                jQuery.a11yfy.assertiveAnnounce("practice groups lists loaded");
                                vm.pgdrop = true;
                                vm.pgdropvisible = true;
                                if (vm.selectedPGs !== undefined && vm.selectedPGs.length > 0) {
                                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText);
                                }
                                vm.lazyloaderpg = true;
                            });
                        }
                        else {
                            if (vm.selectedPGs !== undefined && vm.selectedPGs.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText);
                            }
                            vm.pgdrop = true;
                            vm.pgdropvisible = true;
                        }
                    }
                    else {
                        if (vm.practiceGroups === undefined) {
                            vm.lazyloaderpg = false;
                            getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                                vm.practiceGroups = response.level1;
                                vm.subAolTerms = [];
                                angular.forEach(response.level1, function (pgTerm) {
                                    angular.forEach(pgTerm.level2, function (areaterm) {
                                        angular.forEach(areaterm.level3, function (term) {
                                            vm.subAolTerms.push(term);
                                        });
                                    });
                                });
                                vm.pgdrop = true;
                                vm.pgdropvisible = true;
                                if (vm.selectedPGs !== undefined && vm.selectedPGs.length > 0) {
                                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText);
                                }
                                vm.lazyloaderpg = true;
                            });
                        }
                        else {
                            if (vm.selectedPGs !== undefined && vm.selectedPGs.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText);
                            }
                            vm.pgdrop = true;
                            vm.pgdropvisible = true;
                        }
                    }
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                } else if (vm.pgdropvisible && $event.type === "keyup") {
                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText);
                } else {
                    jQuery.a11yfy.assertiveAnnounce("collapsing practice groups popup");
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.lazyloaderpg = true;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
            }
            //#endregion

            //#region showing and hiding area of law dropdown
            vm.showAreaofLawDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.aoldropvisible) {
                    jQuery.a11yfy.assertiveAnnounce("Expanding the Area of law popup");
                    if (!vm.globalSettings.isBackwardCompatible) {
                        if ((vm.practiceGroups === undefined) && (vm.aolTerms === undefined)) {
                            vm.lazyloaderaol = false;
                            jQuery.a11yfy.assertiveAnnounce(" Area of law terms are loading");
                            getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                                vm.practiceGroups = response.level1;
                                vm.aolTerms = [];
                                angular.forEach(response.level1, function (pgTerm) {
                                    angular.forEach(pgTerm.level2, function (areaterm) {
                                        vm.aolTerms.push(areaterm);
                                    });
                                })
                                vm.aoldrop = true;
                                vm.aoldropvisible = true;
                                jQuery.a11yfy.assertiveAnnounce(" Area of law terms are loaded");
                                if (vm.selectedAOLs !== undefined && vm.selectedAOLs.length > 0) {
                                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText);
                                }
                            });
                        }
                        else {
                            vm.lazyloaderaol = true;
                            if (vm.selectedAOLs !== undefined && vm.selectedAOLs.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText);
                            }
                            vm.aoldrop = true;
                            vm.aoldropvisible = true;
                        }
                    }
                    else {
                        vm.lazyloaderaol = false;
                        if (vm.aolTerms === undefined || vm.aolTerms.length == 0) {
                            getTaxonomyDetailsForClient(optionsForClientGroup, function (response) {
                                vm.aolTerms = response.clientTerms;
                                vm.aoldrop = true;
                                vm.aoldropvisible = true;
                                if (vm.selectedAOLs !== undefined && vm.selectedAOLs.length > 0) {
                                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText);
                                }
                                vm.lazyloaderaol = true;
                            });
                        }
                        else {
                            vm.lazyloaderaol = true;
                            if (vm.selectedAOLs !== undefined && vm.selectedAOLs.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText);
                            }
                            vm.lazyloaderaol = true;
                            vm.aoldrop = true;
                            vm.aoldropvisible = true;
                        }
                    }

                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
                else if (vm.aoldropvisible && $event.type === "keyup") {
                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText);
                }
                else {
                    jQuery.a11yfy.assertiveAnnounce("collapsing Area of law terms popup");
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.lazyloaderaol = true;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
            }
            //#endregion

            //#region showing and hiding sub areaofLaw dropdown
            vm.showSubAreaofLawDrop = function ($event) {
                $event.stopPropagation();
                if (!vm.subAolDropVisible) {
                    jQuery.a11yfy.assertiveAnnounce("Expanding the sub area of law term list popup");
                    if ((vm.practiceGroups === undefined) && (vm.aolTerms === undefined) && (vm.subAolTerms === undefined)) {
                        vm.lazyloadersubaol = false;
                        jQuery.a11yfy.assertiveAnnounce("sub area of law term sare loading");
                        getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                            vm.practiceGroups = response.level1;
                            vm.aolTerms = [];
                            vm.subAolTerms = [];
                            angular.forEach(response.level1, function (pgTerm) {
                                angular.forEach(pgTerm.level2, function (areaterm) {
                                    angular.forEach(areaterm.level3, function (subAreaTerm) {
                                        vm.subAolTerms.push(subAreaTerm);
                                    });
                                });
                            })
                            vm.subAoldrop = true;
                            vm.subAolDropVisible = true;
                            jQuery.a11yfy.assertiveAnnounce("sub area of law terms list loaded");
                            if (vm.selectedSubAOLs !== undefined && vm.selectedSubAOLs.length > 0) {
                                vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText);
                            }
                            vm.lazyloadersubaol = true;
                        });
                    }
                    else {
                        if (vm.selectedSubAOLs !== undefined && vm.selectedSubAOLs.length > 0) {
                            vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText);
                        }
                        vm.subAoldrop = true;
                        vm.subAolDropVisible = true;
                    }
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }
                else if (vm.subAolDropVisible && $event.type === "keyup") {
                    vm.customSelection(vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText);
                }
                else {
                    jQuery.a11yfy.assertiveAnnounce("collapsing sub area of law terms popup");
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                    vm.lazyloadersubaol = true;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
            }
            //#endregion          

            //#Region : Function handle the keyup events in advanced search to check and unchecked user selection.
            vm.customSelection = function (type) {

                if (type !== undefined && type === vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText) {
                    var selectdClients = vm.selectedClients.split(',');  //user altered text value
                    angular.forEach(vm.clients, function (client) {
                        client.Selected = false;
                        angular.forEach(selectdClients, function (clientInput) {
                            if (clientInput.toString().length > 0 && client.name.toString().toLowerCase().indexOf(clientInput.toString().toLowerCase()) !== -1) {
                                client.Selected = true;
                                jQuery.a11yfy.assertiveAnnounce(client.name+"checked");
                            }
                        })
                    });
                }
                else if (type !== undefined && type === vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText) {
                    var selectdPGs = vm.selectedPGs.split(',');  //user altered text value
                    angular.forEach(vm.practiceGroups, function (pgGroup) {
                        pgGroup.Selected = false;
                        angular.forEach(selectdPGs, function (pgInput) {
                            if (pgInput.toString().length > 0 && pgGroup.termName.toString().toLowerCase().indexOf(pgInput.toString().toLowerCase()) !== -1) {
                                pgGroup.Selected = true;
                                jQuery.a11yfy.assertiveAnnounce(pgGroup.termName + "checked");
                            }
                        })
                    });
                }
                else if (type !== undefined && type === vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText) {
                    var selectedAOLs = vm.selectedAOLs.split(',');  //user altered text value
                    angular.forEach(vm.aolTerms, function (aol) {
                        aol.Selected = false;
                        if (!vm.globalSettings.isBackwardCompatible) {
                            angular.forEach(selectedAOLs, function (aolInput) {
                                if (aolInput.toString().length > 0 && aol.termName.toString().toLowerCase().indexOf(aolInput.toString().toLowerCase()) !== -1) {
                                    aol.Selected = true;
                                    jQuery.a11yfy.assertiveAnnounce(aol.termName + "checked");
                                }
                            })
                        }
                        else {
                            angular.forEach(selectedAOLs, function (aolInput) {
                                if (aolInput.toString().length > 0 && aol.name.toString().toLowerCase().indexOf(aolInput.toString().toLowerCase()) !== -1) {
                                    aol.Selected = true;
                                    jQuery.a11yfy.assertiveAnnounce(aol.name + "checked");
                                }
                            })
                        }
                    });
                }
                else if (type !== undefined && type === vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText) {
                    var selectdSubAreaofLaws = vm.selectedSubAOLs.split(';');  //user altered text value
                    angular.forEach(vm.subAolTerms, function (subAreaOfLaw) {
                        subAreaOfLaw.Selected = false;
                        angular.forEach(selectdSubAreaofLaws, function (subAreaOfLawInput) {
                            if (subAreaOfLawInput.toString().length > 0 && subAreaOfLaw.termName.toString().toLowerCase().indexOf(subAreaOfLawInput.toString().toLowerCase()) !== -1) {
                                subAreaOfLaw.Selected = true;
                                jQuery.a11yfy.assertiveAnnounce(subAreaOfLaw.termName + "checked");
                            }
                        })
                    });
                }
            }
            //#endregion

            //#region This event is going to file when the user clicks onm "Select All" and "UnSelect All" links
            vm.checkAll = function (checkAll, type, $event) {
                $event.stopPropagation();
                var checkAnnounc=checkAll?"checked":"unchecked";
                if (type === vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText) {
                    angular.forEach(vm.clients, function (client) {
                        client.Selected = checkAll;
                    });
                    jQuery.a11yfy.assertiveAnnounce("all clients are"+checkAnnounc);
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText) {
                    angular.forEach(vm.practiceGroups, function (pg) {
                        pg.Selected = checkAll;
                    });
                    jQuery.a11yfy.assertiveAnnounce("all practice groups  are" + checkAnnounc);
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText) {
                    angular.forEach(vm.aolTerms, function (aol) {
                        aol.Selected = checkAll;
                    });
                    jQuery.a11yfy.assertiveAnnounce("all area of law terms  are" + checkAnnounc);
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText) {
                    angular.forEach(vm.subAolTerms, function (subAol) {
                        subAol.Selected = checkAll;
                    });
                    jQuery.a11yfy.assertiveAnnounce("all sub area of law terms  are" + checkAnnounc);
                }
            }
            //#endregion

            //#region This event is going to fire when the user clicks on "OK" button in the filter panel
            vm.filterSearchOK = function (type) {
                if (type === vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText) {
                    vm.selectedClients = '';
                    angular.forEach(vm.clients, function (client) {
                        if (client.Selected) {
                            vm.selectedClients = vm.selectedClients + client.name + ","
                        }
                    });
                    vm.selectedClients = vm.selectedClients.slice(0, vm.selectedClients.length - 1);
                    vm.selectedClientsForCancel = vm.selectedClients;
                    vm.clientdrop = false;
                    vm.clientdropvisible = false;
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText) {
                    vm.selectedPGs = '';
                    vm.selectedAOLs = '';
                    angular.forEach(vm.practiceGroups, function (pg) {
                        if (pg.Selected) {
                            vm.selectedPGs = vm.selectedPGs + pg.termName + ","
                            //For each of the selected pg's select corresponding aol check boxes automatically and update the aol
                            //textbox accordingly
                            angular.forEach(pg.level2, function (areaterm) {
                                areaterm.Selected = true;
                                vm.selectedAOLs = vm.selectedAOLs + areaterm.termName + ","
                            });
                        }
                    });
                    vm.selectedPGs = vm.selectedPGs.slice(0, vm.selectedPGs.length - 1);
                    vm.selectedAOLs = vm.selectedAOLs.slice(0, vm.selectedAOLs.length - 1);
                    if (vm.selectedPGs == "") {
                        angular.forEach(vm.aolTerms, function (aol) {
                            aol.Selected = false;
                        });
                    }
                    vm.selectedPGsForCancel = vm.selectedPGs;
                    vm.selectedAOLsForCancel = vm.selectedAOLs;
                    vm.pgdrop = false;
                    vm.pgdropvisible = false;
                }

                if (type === vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText) {
                    vm.selectedAOLs = '';
                    if (!vm.globalSettings.isBackwardCompatible) {
                        angular.forEach(vm.aolTerms, function (aol) {
                            if (aol.Selected) {
                                vm.selectedAOLs = vm.selectedAOLs + aol.termName + ","
                            }
                        });
                    }
                    else {
                        angular.forEach(vm.aolTerms, function (aol) {
                            if (aol.Selected) {
                                vm.selectedAOLs = vm.selectedAOLs + aol.name + ","
                            }
                        });
                    }
                    vm.selectedAOLs = vm.selectedAOLs.slice(0, vm.selectedAOLs.length - 1);
                    vm.selectedAOLsForCancel = vm.selectedAOLs;
                    vm.aoldrop = false;
                    vm.aoldropvisible = false;
                }

                if (type === vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText) {
                    vm.selectedSubAOLs = '';
                    angular.forEach(vm.subAolTerms, function (subAolTerm) {
                        if (subAolTerm.Selected) {
                            vm.selectedSubAOLs = vm.selectedSubAOLs + subAolTerm.termName + ","
                        }
                    });
                    vm.selectedSubAOLs = vm.selectedSubAOLs.slice(0, vm.selectedSubAOLs.length - 1);
                    vm.selectedSubAOLsForCancel = vm.selectedSubAOLs;
                    vm.subAoldrop = false;
                    vm.subAolDropVisible = false;
                }
            }
            //#endregion

            //#region This event is going to fire when the user clicks on "Cancel" button in the filter panel
            vm.filterSearchCancel = function (type) {
                if (type !== undefined && type === vm.matterDashboardConfigs.AdvSearchLabel1InternalFuncParamText) {
                    if (vm.selectedClientsForCancel !== undefined && vm.selectedClientsForCancel.toString().length > 0) {
                        vm.selectedClients = vm.selectedClientsForCancel;
                        angular.forEach(vm.clients, function (client) {
                            if (vm.selectedClients.indexOf(client.name) > 0) {
                                client.Selected = true;
                            }
                        });
                    }
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel2InternalFuncParamText) {
                    if (vm.selectedPGsForCancel !== undefined && vm.selectedPGsForCancel.toString().length > 0) {
                        vm.selectedPGs = vm.selectedPGsForCancel;
                        angular.forEach(vm.practiceGroups, function (pg) {
                            if (vm.selectedPGs.indexOf(pg.termName) > 0) {
                                pg.Selected = true;
                            }
                        });
                    }
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel3InternalFuncParamText) {
                    if (vm.selectedAOLsForCancel !== undefined && vm.selectedAOLsForCancel.toString().length > 0) {
                        vm.selectedAOLs = vm.selectedAOLsForCancel;
                        angular.forEach(vm.aolTerms, function (aol) {
                            if (vm.selectedAOLs.indexOf(aol.termName) > 0) {
                                aol.Selected = true;
                            }
                        });
                    }
                }
                if (type === vm.matterDashboardConfigs.AdvSearchLabel4InternalFuncParamText) {
                    if (vm.selectedSubAOLsForCancel !== undefined && vm.selectedSubAOLsForCancel.toString().length > 0) {
                        vm.selectedSubAOLs = vm.selectedSubAOLsForCancel;
                        angular.forEach(vm.subAolTerms, function (subAol) {
                            if (vm.selectedSubAOLs.indexOf(subAol.termName) > 0) {
                                subAol.Selected = true;
                            }
                        });
                    }
                }
                vm.clientdrop = false;
                vm.clientdropvisible = false;
                vm.pgdrop = false;
                vm.pgdropvisible = false;
                vm.aoldrop = false;
                vm.aoldropvisible = false;
                vm.subAoldrop = false;
                vm.subAolDropVisible = false;
            }
            //#endregion

            //#region File upload functionality
            vm.Openuploadmodal = function (matterName, matterUrl, matterGUID) {
                vm.getFolderHierarchy(matterName, matterUrl, matterGUID);
                vm.oUploadGlobal.successBanner = false;
                vm.isLoadingFromDesktopStarted = false;
            }
            //#endregion

            //#region Code to get folder hierarchy.
            vm.getFolderHierarchy = function (matterName, matterUrl, matterGUID) {

                if ((matterName && matterName !== "") && (matterUrl && matterUrl !== "") && (matterGUID && matterGUID !== "")) {
                    var row = $filter("filter")(vm.matterGridOptions.data, matterGUID);
                    if(row.length>0){
                        vm.currentRow = row[0];
                    }                    
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
                    vm.lazyloader = true;
                });
            }
            //#endregion

            //#region This function will handle the files that has been dragged from the user desktop
            vm.ducplicateSourceFile = [];
            vm.handleDesktopDrop = function (targetDropUrl, sourceFiles, isOverwrite) {
                vm.oUploadGlobal.successBanner = false;              
                vm.FilesFromDesktopOrMail = "filesfromdesktop";
                vm.DesktopDroppedFiles = {};
                vm.DesktopDroppedFiles.targetDropUrl = targetDropUrl;
                vm.DesktopDroppedFiles.sourceFiles = sourceFiles;
                vm.DesktopDroppedFiles.isOverwrite = isOverwrite;
                if (vm.addtionalPropertiesAvaialbleForMatter) {                   
                    jQuery('#UploadExtraMatterPropertiesModal').modal("show");
                } else {
                    vm.uploadDesktopDroppedFiles(null);
                }

            }
            //method to upload desktop dropped file with extraproperties
            vm.uploadDesktopDroppedFiles = function (matterExtraPropertiesValues) {
                vm.oUploadGlobal.successBanner = false;
                vm.isLoadingFromDesktopStarted = true;
                var targetDropUrl = vm.DesktopDroppedFiles.targetDropUrl;
                var sourceFiles = vm.DesktopDroppedFiles.sourceFiles;
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
                jQuery.a11yfy.assertiveAnnounce('Uploading files. Please wait...');
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
                                    jQuery.a11yfy.assertiveAnnounce('files uploaded successfully to folder' + response.data[i].dropFolder);
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
                                            jQuery.a11yfy.assertiveAnnounce(response.data[i].value)
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
                                                jQuery.a11yfy.assertiveAnnounce(file[0].value)
                                            }

                                        }
                                    }
                                    else {
                                        vm.IsDupliacteDocument = true;
                                        response.data[i].ok = "True";
                                        response.data[i].value = "The file <b >" + response.data[i].fileName + " </b> is failed to upload";
                                        vm.ducplicateSourceFile.push(response.data[i]);
                                        jQuery.a11yfy.assertiveAnnounce(response.data[i].value)
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

            }
            //#endregion

            vm.uploadedFiles = [];            
            //#endregion


            //#region For Sorting by Alphebatical or Created date
            vm.FilterByType = function () {
                vm.beforeSortingAccessibilityMessage(jsonMatterSearchRequest);
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                if (vm.tabClicked === "Pinned Matters") {
                    
                    jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                    getPinnedMatters(jsonMatterSearchRequest, function (response) {
                        if (response == "" || response.length == 0) {
                            vm.nodata = true;
                            vm.divuigrid = false;
                            vm.displaypagination = false;
                            vm.lazyloaderdashboard = true;
                        }
                        else {
                            var pinnedResponse = response;
                            if (response && response.length > 0) {
                                angular.forEach(response, function (res) {
                                    res.pinType = "unpin"
                                })
                            }
                            vm.Pinnedobj = response
                            vm.matterGridOptions.data = response;
                            vm.totalrecords = vm.pinMatterCount;
                            vm.selectedTabCount = vm.pinMatterCount;
                            vm.pagination();
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            vm.nodata = false;
                            vm.divuigrid = true;
                            vm.lazyloaderdashboard = true;
                            vm.displaypagination = true;
                            vm.afterSortingAccessibilityMessage(jsonMatterSearchRequest);
                        }
                    });
                }
                else {
                    get(jsonMatterSearchRequest, function (response) {
                        vm.lazyloader = true;
                        if (response == "" || response.length == 0) {
                            vm.getMatterCounts();
                            $scope.errorMessage = response.message;
                        } else {
                            vm.showMatterAsPinOrUnpin(response, jsonMatterSearchRequest);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            vm.afterSortingAccessibilityMessage(jsonMatterSearchRequest);
                        }
                    });
                }
            }
            //#endregion

            //#region For Sorting by column name and ascending and desending direction
            vm.sortExpression = function (byProperty, byColumn, sortDirection) {
                jsonMatterSearchRequest.SearchObject.Sort.ByProperty = byProperty;
                jsonMatterSearchRequest.SearchObject.Sort.Direction = sortDirection;
                jsonMatterSearchRequest.SearchObject.Sort.ByColumn = byColumn;
                vm.FilterByType();
            }

            vm.sortby = function (sortexp, data) {
                vm.sortbytext = data;
                vm.sortbydrop = false;
                if (vm.tabClicked !== "Pinned Matters") {
                    if (sortexp == 'AlphabeticalUp') {
                        vm.sortExpression(vm.configSearchContent.ManagedPropertyMatterName, vm.configSearchContent.ManagedPropertyMatterName, 0);
                    }
                    else if (sortexp == 'AlphabeticalDown') {
                        vm.sortExpression(vm.configSearchContent.ManagedPropertyMatterName, vm.configSearchContent.ManagedPropertyMatterName, 1);
                    }
                    else if (sortexp == 'CreateddateUp') {
                        vm.sortExpression(vm.configSearchContent.ManagedPropertyOpenDate, vm.configSearchContent.ManagedPropertyOpenDate, 0);
                    }
                    else if (sortexp == 'CreateddateDown') {
                        vm.sortExpression(vm.configSearchContent.ManagedPropertyOpenDate, vm.configSearchContent.ManagedPropertyOpenDate, 1);
                    }
                    else {
                        vm.sortExpression(vm.configSearchContent.ManagedPropertyLastModifiedTime, vm.configSearchContent.ManagedPropertyLastModifiedTime, 1);
                    }
                }
                else {
                    if (sortexp == 'AlphabeticalUp') {
                        vm.sortExpression("MatterName", "MatterName", 0);
                    }
                    else if (sortexp == 'AlphabeticalDown') {
                        vm.sortExpression("MatterName", "MatterName", 1);
                    }
                    else if (sortexp == 'CreateddateUp') {
                        vm.sortExpression("MatterCreatedDate", "MatterCreatedDate", 0);
                    }
                    else if (sortexp == 'CreateddateDown') {
                        vm.sortExpression("MatterCreatedDate", "MatterCreatedDate", 1);
                    }
                    else {
                        vm.sortExpression("MatterModifiedDate", "MatterModifiedDate", 1);
                    }
                }
            }
            //#endregion

            //Declaring variables for pagination
            vm.first = 1;
            vm.last = gridOptions.paginationPageSize;
            vm.total = 0;
            vm.pagenumber = 1;
            vm.fromtopage = vm.first + " - " + vm.last;
            vm.displaypagination = false;

            //#region Functionality to implement pagination in grid.
            vm.pagination = function () {
                vm.first = 1;
                vm.last = gridOptions.paginationPageSize;
                vm.total = 0;
                vm.pagenumber = 1;
                vm.fromtopage = vm.first + " - " + vm.last;
                vm.displaypagination = false;
                vm.total = vm.totalrecords - gridOptions.paginationPageSize;
                if (vm.totalrecords > gridOptions.paginationPageSize) {
                    vm.fromtopage = vm.first + " - " + vm.last;
                }
                else {
                    if (vm.total < gridOptions.paginationPageSize) { vm.fromtopage = vm.first + " - " + vm.totalrecords; } else {
                        vm.fromtopage = vm.first + " - " + vm.last;
                    }
                }
                vm.setWidthtoPagination();
                if (vm.totalrecords == 0) {
                    vm.displaypagination = false;
                } else {
                    vm.displaypagination = true;
                    $interval(function () { vm.setPaginationHeight() }, 500, angular.element(".ui-grid-canvas").css('visibility') != 'hidden');
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            };
            //#endregion

            //#region Functionality to get records on next page in grid.
            vm.next = function () {
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                if (vm.last < vm.totalrecords) {
                    vm.first = vm.first + gridOptions.paginationPageSize;
                    vm.last = vm.last + gridOptions.paginationPageSize;
                    vm.total = vm.totalrecords - gridOptions.paginationPageSize;
                    if (vm.last > vm.totalrecords) {
                        vm.fromtopage = vm.first + " - " + vm.totalrecords;
                    } else {
                        vm.fromtopage = vm.first + " - " + vm.last;
                    }
                    vm.setWidthtoPagination();
                    vm.pagenumber = vm.pagenumber + 1;
                    if (vm.selectedTab == vm.matterDashboardConfigs.Tab1HeaderText) {
                        jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 1;
                    } else {
                        jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                    }
                    jsonMatterSearchRequest.SearchObject.PageNumber = vm.pagenumber;
                    jsonMatterSearchRequest.SearchObject.ItemsPerPage = gridOptions.paginationPageSize;

                    get(jsonMatterSearchRequest, function (response) {
                        vm.lazyloaderdashboard = true;
                        if (response == "" || response.length == 0) {
                            vm.divuigrid = false;
                            vm.nodata = true;
                            vm.lazyloaderdashboard = true;
                            vm.displaypagination = true;
                        } else {
                            jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                            getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                                if (pinnedResponse && pinnedResponse.length > 0) {
                                    vm.Pinnedobj = pinnedResponse;
                                    vm.pinMatterCount = vm.Pinnedobj.length
                                    angular.forEach(pinnedResponse, function (pinobj) {
                                        angular.forEach(response, function (res) {
                                            //Check if the pinned matter name is equal to search matter name
                                            if (pinobj.matterName == res.matterName) {
                                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                    res.ismatterdone = true;
                                                    res.pinType = "unpin"
                                                }
                                            }
                                        });
                                    });
                                    vm.matterGridOptions.data = response;
                                    vm.lazyloaderdashboard = true;
                                    vm.divuigrid = true;

                                }
                                else {
                                    vm.matterGridOptions.data = response;
                                    vm.lazyloaderdashboard = true;
                                    vm.pinMatterCount = 0;
                                    vm.divuigrid = true;
                                }
                                vm.displaypagination = true;
                                $interval(function () { vm.setPaginationHeight() }, 500, angular.element(".ui-grid-canvas").css('visibility') != 'hidden');
                                $anchorScroll();
                            });
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    });
                } else {
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            };
            //#endregion

            //#region Functionality to get records on previous page in grid.
            vm.prev = function () {
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                if (vm.last > gridOptions.paginationPageSize) {
                    vm.first = vm.first - gridOptions.paginationPageSize;
                    vm.last = vm.last - gridOptions.paginationPageSize;
                    vm.pagenumber = vm.pagenumber - 1;
                    vm.fromtopage = vm.first + " - " + vm.last;
                    vm.setWidthtoPagination();
                    if (vm.selectedTab == vm.matterDashboardConfigs.Tab1HeaderText) {
                        jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 1;
                    } else {
                        jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                    }
                    jsonMatterSearchRequest.SearchObject.PageNumber = vm.pagenumber;
                    jsonMatterSearchRequest.SearchObject.ItemsPerPage = gridOptions.paginationPageSize;

                    get(jsonMatterSearchRequest, function (response) {
                        vm.lazyloaderdashboard = true;
                        if (response == "" || response.length == 0) {
                            vm.divuigrid = false;
                            vm.nodata = true;
                            vm.lazyloaderdashboard = true;
                            vm.displaypagination = true;
                        } else {
                            jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                            getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                                if (pinnedResponse && pinnedResponse.length > 0) {
                                    vm.Pinnedobj = pinnedResponse;
                                    vm.pinMatterCount = vm.Pinnedobj.length
                                    angular.forEach(pinnedResponse, function (pinobj) {
                                        angular.forEach(response, function (res) {
                                            //Check if the pinned matter name is equal to search matter name
                                            if (pinobj.matterName == res.matterName) {
                                                if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                    res.ismatterdone = true;
                                                    res.pinType = "unpin"
                                                }
                                            }
                                        });
                                    });
                                    vm.matterGridOptions.data = response;
                                    vm.lazyloaderdashboard = true;
                                    vm.divuigrid = true;

                                }
                                else {
                                    vm.matterGridOptions.data = response;
                                    vm.lazyloaderdashboard = true;
                                    vm.pinMatterCount = 0;
                                    vm.divuigrid = true;
                                }
                                vm.displaypagination = true;
                                $interval(function () { vm.setPaginationHeight() }, 500, angular.element(".ui-grid-canvas").css('visibility') != 'hidden');
                                $anchorScroll();
                            });
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    });
                } else {
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            };
            //#endregion

            //#region to show clients through texonomy.
            vm.showclients = function ($event) {
                $event.stopPropagation();
                if (vm.clients === undefined) {
                    getTaxonomyDetailsForClient(optionsForClientGroup, function (response) {
                        vm.clients = response.clientTerms;
                    });
                }
                vm.clientdrop = true;
                vm.clientdropvisible = true;
            }
            //endregion

            //#region Upload desktop files functionality starts
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
            $rootScope.breadcrumb = true;
            $rootScope.foldercontent = false;
            vm.hideBreadCrumb = function () {
                $rootScope.breadcrumb = true;
                $rootScope.foldercontent = false;

            }
            //endregion

            //#region To get content check connection configurations
            function getContentCheckConfigurations(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getDefaultMatterConfigurations',
                    data: options,
                    success: callback
                });
            }
            //endregion

            //#region To get content check configurations
            vm.getContentCheckConfigurations = function (siteCollectionPath) {
                siteCollectionPath = JSON.stringify(siteCollectionPath);
                getContentCheckConfigurations(siteCollectionPath, function (response) {
                    if (!response.isError) {
                        var defaultMatterConfig = JSON.parse(response.code);
                        vm.oUploadGlobal.bAllowContentCheck = defaultMatterConfig.IsContentCheck;
                    } else {
                        vm.oUploadGlobal.bAllowContentCheck = false;
                    }
                });
            }
            //endregion

            //#region To expand and collapse the folder tree structure in upload
            vm.showSelectedFolderTree = function (folder) {
                function setActiveItem(item) {
                    if (item.children !== null) {
                        angular.forEach(item.children, function (child) {
                            if (item.parentURL !== null) {
                                if (item.active) {
                                    child.active = child.active ? false : true;
                                    if (!child.active) { setActiveItem(child); }
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

            //#region Functionality  to check content notification.
            vm.contentCheckNotification = function (file, isLocalUpload) {
                file.contentCheck = "contentCheck";
                file.saveLatestVersion = "False";
                file.cancel = "False";
            }
            //#endRegion

            //#region Functionality to abort content check.
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

            //#region Functionality to close success banner.
            vm.closeSuccessBanner = function () {
                vm.oUploadGlobal.successBanner = false;
            }
            //#end region

            //#region performs action when clicked on the search button in header flyout
            vm.getSearchResults = function () {
                angular.element('#allMatters').addClass("active");
                angular.element('#myMatters').removeClass("active");
                angular.element('#pinMatters').removeClass("active");
                vm.searchClicked = true;
                vm.lazyloaderdashboard = false;
                vm.divuigrid = false;
                vm.displaypagination = false;
                vm.nodata = false;
                vm.searchdrop = false;
                vm.upwarddrop = false;
                vm.downwarddrop = true;
                var clientArray = [];
                var aolListarray = [];
                var subAolListarray = [];
                var pglistArray = [];
                var startdate = "";
                var enddate = "";
                vm.selectedTab = vm.matterDashboardConfigs.Tab2HeaderText;

                if (vm.selectedClients != "" && vm.selectedClients != undefined) {
                    if (!vm.globalSettings.isBackwardCompatible) {
                        clientArray = vm.selectedClients.split(',');
                    }
                }
                if (vm.selectedPGs != "" && vm.selectedPGs != undefined) {
                    jsonMatterSearchRequest.SearchObject.Filters.PracticeGroup = vm.selectedPGs;
                } else {
                    jsonMatterSearchRequest.SearchObject.Filters.PracticeGroup = "";
                }
                if (vm.selectedAOLs != "" && vm.selectedAOLs != undefined) {
                    jsonMatterSearchRequest.SearchObject.Filters.AreaOfLaw = vm.selectedAOLs
                }
                else {
                    jsonMatterSearchRequest.SearchObject.Filters.AreaOfLaw = "";
                }
                if (vm.selectedSubAOLs != "" && vm.selectedSubAOLs != undefined) {
                    jsonMatterSearchRequest.SearchObject.Filters.SubareaOfLaw = vm.selectedSubAOLs;
                }
                else {
                    jsonMatterSearchRequest.SearchObject.Filters.SubareaOfLaw = "";
                }
                if (vm.startDate != "" && vm.startDate != undefined) {
                    startdate = $filter('date')(vm.startDate, "yyyy-MM-ddT00:00:00") + "Z";
                }
                if (vm.endDate != "" && vm.endDate != undefined) {
                    enddate = $filter('date')(vm.endDate, "yyyy-MM-ddT23:59:59") + "Z";
                }
                if (vm.selected == "") {
                    jsonMatterSearchRequest.SearchObject.SearchTerm = "";
                }
                jsonMatterSearchRequest.SearchObject.Filters.FilterByMe = 0;
                jsonMatterSearchRequest.SearchObject.Filters.ClientsList = clientArray;
                jsonMatterSearchRequest.SearchObject.PageNumber = 1;
                jsonMatterSearchRequest.SearchObject.Filters.FromDate = startdate;
                jsonMatterSearchRequest.SearchObject.Filters.ToDate = enddate;
                jsonMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                get(jsonMatterSearchRequest, function (response) {
                    if (response == "" || response.length == 0) {
                        vm.matterGridOptions.data = [];
                        jsonMatterSearchRequest.SearchObject.Sort.ByProperty = "";
                        jsonMatterSearchRequest.SearchObject.Sort.Direction = 1;
                        jsonMatterSearchRequest.SearchObject.Sort.ByColumn = "";
                        vm.getMatterCounts();
                    } else {
                        getPinnedMatters(jsonMatterSearchRequest, function (pinnedResponse) {
                            if (pinnedResponse && pinnedResponse.length > 0) {
                                vm.Pinnedobj = pinnedResponse;
                                vm.pinMatterCount = vm.Pinnedobj.length
                                angular.forEach(pinnedResponse, function (pinobj) {
                                    angular.forEach(response, function (res) {
                                        //Check if the pinned matter name is equal to search matter name
                                        if (pinobj.matterName == res.matterName) {
                                            if (res.ismatterdone == undefined && !res.ismatterdone) {
                                                res.ismatterdone = true;
                                                res.pinType = "unpin"
                                            }
                                        }
                                    });
                                });
                                vm.matterGridOptions.data = response;
                                vm.getMatterCounts();
                            }
                            else {
                                vm.showMatterAsPinOrUnpin(response, jsonMatterSearchRequest);
                            }
                            $interval(function () { vm.setPaginationHeight() }, 500, angular.element(".ui-grid-canvas").css('visibility') != 'hidden');
                        });
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                });
            }
            //#endregion

            if (vm.teamName !== '') {
                vm.selectedTab = vm.matterDashboardConfigs.Tab2HeaderText;
                vm.getSearchResults();
            }
            else {
                $timeout(function () { vm.myMatters() }, 500);
            }

            //#region Exporting to Excel Test
            vm.export = function () {
                var exportMatterSearchRequest = {
                    Client: {
                        Url: configs.global.repositoryUrl
                    },
                    SearchObject: {
                        PageNumber: 1,
                        ItemsPerPage: 500,
                        SearchTerm: jsonMatterSearchRequest.SearchObject.SearchTerm,
                        Filters: {
                            ClientsList: jsonMatterSearchRequest.SearchObject.Filters.ClientsList,
                            PGList: jsonMatterSearchRequest.SearchObject.Filters.PGList,
                            AOLList: jsonMatterSearchRequest.SearchObject.Filters.AOLList,
                            FromDate: jsonMatterSearchRequest.SearchObject.Filters.FromDate,
                            ToDate: jsonMatterSearchRequest.SearchObject.Filters.ToDate,
                            FilterByMe: jsonMatterSearchRequest.SearchObject.Filters.FilterByMe
                        },
                        Sort: {
                            ByProperty: jsonMatterSearchRequest.SearchObject.Sort.ByProperty,
                            Direction: jsonMatterSearchRequest.SearchObject.Sort.Direction
                        }
                    }
                };
                if (vm.tabClicked != "Pinned Matters") {
                    exportMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = false;
                    get(exportMatterSearchRequest, function (response) {
                        if (response == "" || response.length == 0) {
                        } else {
                            vm.exportDate = response;

                            $timeout(function () {
                                $("#exportable").table2excel({
                                    exclude: ".noExl",
                                    name: "Matters",
                                    filename: "Matters" //do not include extension
                                });
                            }, 1000);
                        }
                    });
                } else {
                    var pinnedMattersRequest = {
                        Url: configs.global.repositoryUrl//ToDo: Read from config.js
                    }
                    exportMatterSearchRequest.SearchObject.Sort.SortAndFilterPinnedData = true;
                    getPinnedMatters(exportMatterSearchRequest, function (response) {
                        if (response == "" || response.length == 0) {

                        } else {
                            vm.exportDate = response;

                            $timeout(function () {
                                $("#exportable").table2excel({
                                    exclude: ".noExl",
                                    name: "Matters",
                                    filename: "Matters" //do not include extension
                                });
                            }, 1000);
                        }
                    });
                }
            }
            //#endregion

            //#region for opening view matters url in new window
            vm.viewMatterDetails = function (url, guid) {
                var viewmatterurl = url + '/SitePages/' + guid + '.aspx';
                window.open(viewmatterurl, '_parent');
            }
            //#endregion

            //#region showing the hidden tabs in responsive
            vm.showDocTabs = function ($event) {
                $event.stopPropagation();
                if (vm.showInnerNav) {
                    vm.showNavTab = true;
                    vm.showInnerNav = false;
                }
            }

            vm.disableNavTab = function () {
                vm.showNavTab = false;
                vm.showInnerNav = true;;
            }
            //#endregion

            //#region showing the hidden tabs in responsive
            vm.showSelectedTabs = function (name, count) {
                vm.selectedTab = name;
                vm.selectedTabInfo = vm.selectedTab + " (" + count + ")";
                if (name == vm.matterDashboardConfigs.Tab1HeaderText) {
                    vm.myMatters();
                }
                else if (name == vm.matterDashboardConfigs.Tab2HeaderText) {
                    vm.search();
                } else {
                    vm.getMatterPinned();
                }
                vm.showNavTab = false;
                vm.showInnerNav = true;;
            }
            //#endregion

            //#region To display modal up in center of the screen...
            vm.reposition = function () {
                var modal = $(this)

                var dialog = modal.find('.modal-dialog');
                modal.css('display', 'block');
                // Dividing by two centers the modal exactly, but dividing by three  
                // or four works better for larger screens. 
                dialog.css("margin-top", Math.max(0, (screen.height - dialog.height()) / 4));
            }

            // Reposition when a modal is shown 
            jQuery('.modal').on('show.bs.modal', vm.reposition);

            // Reposition when the window is resized 
            jQuery(window).on('resize', function () {
                jQuery('.modal:visible').each(vm.reposition);
            });

            $timeout(vm.reposition(), 100);
            //#endregion 

            // Reposition when the window is resized
            angular.element($window).bind('resize', function () {
                if ($window.innerWidth > 867) {
                    vm.showNavTab = false;
                    vm.showInnerNav = true;
                }
            });

            //#region for stting the height of the pagination
            vm.setPaginationHeight = function () {
                var height = angular.element(".ui-grid-canvas").height();
                if (vm.teamName !== '') {
                    angular.element('.jsonGridFooter').css("top", height + 225);
                }
                else {
                    angular.element('.jsonGridFooter').css("top", height + 180);
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }

            vm.beforeSortingAccessibilityMessage = function (searchRequest) {
                if (searchRequest.SearchObject.Sort.Direction == 0) {
                    jQuery.a11yfy.assertiveAnnounce("sorting data by " + searchRequest.SearchObject.Sort.ByColumn + " in ascending order");
                } else if (searchRequest.SearchObject.Sort.Direction == 1) {
                    jQuery.a11yfy.assertiveAnnounce("sorting data by " + searchRequest.SearchObject.Sort.ByColumn + " in descending order");
                }
            }
            vm.afterSortingAccessibilityMessage = function (searchRequest) {
                if (searchRequest.SearchObject.Sort.Direction == 0) {
                    jQuery.a11yfy.assertiveAnnounce("sorted data by " + searchRequest.SearchObject.Sort.ByColumn + " in ascending order");
                } else if (searchRequest.SearchObject.Sort.Direction == 1) {
                    jQuery.a11yfy.assertiveAnnounce("sorted data by " + searchRequest.SearchObject.Sort.ByColumn + " in descending order");
                }
            }


            //#region to set the dynamic min-width to the pagination div
            vm.setWidthtoPagination = function () {
                var txt = vm.fromtopage;
                if (txt.length <= 5) {
                    angular.element('.fromToPageWidth').css("min-width", "43px");
                } else if (txt.length <= 7) {
                    angular.element('.fromToPageWidth').css("min-width", "64px");
                } else if (txt.length <= 9) {
                    angular.element('.fromToPageWidth').css("min-width", "84px");
                }
            }
            //#endregion

            //#region For removing the active class from the tabs that are not selected
            vm.hideTabs = function ($event) {
                if (!vm.lazyloaderdashboard) {
                    if (vm.selectedTab == vm.matterDashboardConfigs.Tab1HeaderText) {
                        angular.element('#allMatters').removeClass("active");
                        angular.element('#myMatters').addClass("active");
                        angular.element('#pinMatters').removeClass("active");
                    } else if (vm.selectedTab == vm.matterDashboardConfigs.Tab2HeaderText) {
                        angular.element('#allMatters').addClass("active");
                        angular.element('#myMatters').removeClass("active");
                        angular.element('#pinMatters').removeClass("active");
                    } else {
                        angular.element('#allMatters').removeClass("active");
                        angular.element('#myMatters').removeClass("active");
                        angular.element('#pinMatters').addClass("active");
                    }
                }
            }
            vm.pageLoadCompleted = function () {
                jQuery.a11yfy.assertiveAnnounce("Matters dashboard page loaded successfully");
            }
            //#endregion
            vm.ariaMessage = function (message) {
                jQuery.a11yfy.assertiveAnnounce(message);                
            }
           
            //#region for additional matter properties
            vm.addtionalPropertiesAvaialbleForMatter = false;
            //#region function to get content type name from the term
            function getAdditionalContentTypeName() {
                vm.addtionalPropertiesAvaialbleForMatter = false;
                vm.matterExtraPropertiesValues = null;
                var getExtraMatterProp = false;
                var levels = vm.taxonomyData.levels;
                var termData = vm.taxonomyData.level1;
                angular.forEach(termData, function (levelOneTerm) {
                    if (levelOneTerm.termName == vm.currentRow.matterPracticeGroup) {
                        angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {
                            if (levelTwoTerm.termName == vm.currentRow.matterAreaOfLaw) {
                                angular.forEach(levelTwoTerm.level3, function (levelThreeTerm) {
                                    if (levels == 3) {
                                        if (levelThreeTerm.termName == vm.currentRow.matterDefaultContentType) {
                                            getExtraMatterProp = IsCustomPropertyPresentInTerm(levelThreeTerm);
                                        }

                                    } else if (levels == 4) {
                                        angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                            if (levelFourTerm.termName == vm.currentRow.matterDefaultContentType) {
                                                getExtraMatterProp = IsCustomPropertyPresentInTerm(levelFourTerm);
                                            }
                                        });
                                    }
                                    else if (levels == 5) {
                                        angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                            angular.forEach(levelFourTerm.level5, function (levelFiveTerm) {
                                                if (levelFiveTerm.termName == vm.currentRow.matterDefaultContentType) {
                                                    getExtraMatterProp = IsCustomPropertyPresentInTerm(levelFiveTerm);
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
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

            vm.matterExtraFields = [];
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


            // To get extra field properties values set by user.
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

            //#endregion


        }
    ]);

    //#region For adding custom filter 
    app.filter('selectclients', function () {
        return function (input, output) {
            var filteredresult = [];
            for (var i = 0; i < input.length; i++) {
                if (input[i].name.indexOf(output)) {
                    input[i].checked = true;
                    filteredresult.push(input[i]);
                } else {
                    input[i].checked = false;
                    filteredresult.pop(input[i]);
                }
            }
            return filteredresult;
        };
    });
    //#endregion   
})();