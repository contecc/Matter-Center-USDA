﻿(function () {
    'use strict;'
    var app = angular.module("matterMain");
    app.controller('SettingsController', ['$scope', '$state', '$interval', '$stateParams', 'api', '$timeout', 'settingsResource', '$rootScope', 'uiGridConstants', '$location', '$http', '$q', '$filter', 'commonFunctions', '$window',
        function settingsController($scope, $state, $interval, $stateParams, api, $timeout, settingsResource, $rootScope, uiGridConstants, $location, $http, $q, $filter, commonFunctions, $window) {
            var vm = this;
            vm.popupContainerBackground = "hide";
            vm.popupContainer = "hide";
            vm.selectedDocumentTypeLawTerms = [];
            vm.createMatterTaxonomyColumnNames = configs.contentTypes.managedColumns;
            vm.showDenyMessage = '';
            vm.createContent = uiconfigs.CreateMatter;
            vm.taxonomyHierarchyLevels = configs.taxonomy.levels;
            vm.global = configs.global;
            vm.uri = configs.uri;
            vm.selectedDocumentTypeLawTerms = [];
            vm.documentTypeLawTerms = [];
            vm.primaryMatterType = vm.errorPopUp = false;
            vm.removeDTItem = false;
            $rootScope.displayOverflow = "display";
            vm.isClientMappedWithHierachy = configs.global.isClientMappedWithHierachy;
            vm.taxonomyHierarchyLevels = parseInt(vm.taxonomyHierarchyLevels);
            if (vm.taxonomyHierarchyLevels >= 2) {
                vm.parentLevelOneList = [];
                vm.levelOneList = [];
                vm.levelTwoList = [];
            }
            if (vm.taxonomyHierarchyLevels >= 3) {
                vm.levelThreeList = [];
            }
            if (vm.taxonomyHierarchyLevels >= 4) {
                vm.levelFourList = [];
            }
            if (vm.taxonomyHierarchyLevels >= 5) {
                vm.levelFiveList = [];
            }

            //#region API to check whether the current login user is owner or not
            function isLoginUserOwner(optionsForClientUrl, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'isLoginUserOwner',
                    data: optionsForClientUrl,
                    success: callback
                });
            }

            //#region API to get the client taxonomy 
            function getTaxonomyDetails(optionsForClientGroup, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'getTaxonomyData',
                    data: optionsForGroup,
                    success: callback
                });
            }

            //#region API to get the practice taxonomy 
            function getTaxonomyDetailsForPractice(optionsForPracticeGroup, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'getTaxonomyData',
                    data: optionsForPracticeGroup,
                    success: callback
                });
            }

            //API call to get roles that are configured in the system
            function getRoles(options, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'getRoles',
                    data: options,
                    success: callback
                });
            }
            //API call to get permission levels that are configured in the system
            function getPermissionLevels(options, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'getPermissionLevels',
                    data: options,
                    success: callback
                });
            }

            //API call to get default configurations 
            function getDefaultConfigurations(options, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'getDefaultConfigurations',
                    data: JSON.stringify(options),
                    success: callback
                });
            }

            //API call to get matter extra properties 
            function getmatterprovisionextraproperties(options, callback) {
                api({
                    resource: 'matterResource',
                    method: 'getmatterprovisionextraproperties',
                    data: options,
                    success: callback
                });
            }

            //API call to save settings
            function saveConfigurations(options, callback) {
                api({
                    resource: 'settingsResource',
                    method: 'saveConfigurations',
                    data: options,
                    success: callback
                });
            }

            //#region global variables
            $rootScope.bodyclass = "";
            $rootScope.profileClass = "hide";
            vm.assignPermissionTeams = [{ assignedUser: '', assignedRole: '', assignedPermission: '', assigneTeamRowNumber: 1 }];
            vm.assignRoles = [];
            vm.settingsConfigs = uiconfigs.Settings;
            vm.assignPermissions = [];
            vm.successmessage = false;
            vm.canAccessSettingsPage = true;
            //#endregion

            //#region for hiding the client details on load
            vm.showClientDetails = false;
            //#endregion

            //#region To set the  dynamic height to content
            vm.setContentHeight = function () {
                var headerHeight = angular.element("#matterCenterHeader").height();
                var footerHeight = angular.element("#footer").height();
                var screenHeight = $window.screen.availHeight;
                var minContentHeight = (screenHeight) - (headerHeight + footerHeight);
                angular.element("#contentDiv").css("min-height", minContentHeight);
            }
            //#endregion

            var optionsForClientUrl = {
                Url: configs.global.isBackwardCompatible ? configs.global.repositoryUrl : configs.uri.SPOsiteURL
            };

            //#region requestobject for getting the taxonomy data
            var optionsForGroup = {
                Client: {
                    Url: configs.global.repositoryUrl
                },
                TermStoreDetails: {
                    TermGroup: configs.taxonomy.termGroup,
                    TermSetName: configs.taxonomy.clientTermSetName,
                    CustomPropertyName: configs.taxonomy.clientCustomPropertiesURL
                }
            };
            //#endregion

            vm.clientlist = false;
            vm.nodata = false;
            vm.lazyloader = false;
            //#region function for getting the client details
            var optionsForPracticeGroup = new Object;
            optionsForPracticeGroup = {
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

            vm.isLoginUserOwner = function () {
                $timeout(function () { vm.lazyloader = false; }, 10);

                isLoginUserOwner(optionsForClientUrl, function (response) {
                    if (response != null) {
                        vm.canAccessSettingsPage = response.isLoginUserOwner;

                        if (vm.canAccessSettingsPage) {
                            //#region for calling the functions on page load
                            vm.getTaxonomyData();
                            vm.getRolesData();
                            vm.getPermissionsData();
                            angular.element('#matterCenterHeader').addClass('showCommonContent');
                            angular.element('#footer').addClass('showCommonContent');
                            //#endregion
                        }
                        else {
                            vm.showDenyMessage = vm.settingsConfigs.DenySupportMailMessage
                            angular.element('#matterCenterHeader').removeClass('commonContent');
                            angular.element('#matterCenterHeader').addClass('hideCommonContent');
                            angular.element('#footer').removeClass('commonContent');
                            angular.element('#footer').addClass('hideCommonContent');
                        }
                        vm.lazyloader = true;
                        vm.popupContainerBackground = "hide";
                    }
                })
            }


            vm.taxonomydata = [];
            vm.getTaxonomyData = function () {
                vm.popupContainerBackground = "Show";
                $timeout(function () { vm.lazyloader = false; }, 10);
                getTaxonomyDetails(optionsForGroup, function (response) {
                    if (response != "") {
                        vm.clientlist = true;
                        vm.nodata = false;
                        vm.taxonomydata = response.clientTerms;
                        vm.lazyloader = false;
                        vm.popupContainerBackground = "Show";
                        getTaxonomyDetailsForPractice(optionsForPracticeGroup, function (response) {
                            if (response.isError !== undefined && response.isError) {

                            } else {
                                vm.levelOneList = response.level1;
                                vm.parentLevelOneList = response;
                                vm.selectedLevelOneItem = response.level1[0];
                                getTaxonomyHierarchy(response);
                                vm.lazyloader = true;
                                vm.popupContainerBackground = "hide";
                            }
                        });
                    } else {
                        vm.clientlist = false;
                        vm.nodata = true;
                        vm.lazyloader = true;
                    }
                });
            }
            //#endregion

            function getTaxonomyHierarchy(data) {
                var levelsDefined = data.levels;
                if (levelsDefined >= 2) {
                    vm.levelOneList = data.level1;
                    vm.levelTwoList = vm.levelOneList[0].level2;
                    vm.activeLevelTwoItem = vm.levelTwoList[0];
                }
                if (levelsDefined >= 3) {
                    vm.levelThreeList = vm.levelTwoList[0].level3;
                    vm.activeLevelThreeItem = vm.levelThreeList[0];
                }
                if (levelsDefined >= 4) {
                    vm.levelFourList = vm.levelThreeList[0].level4;
                    vm.activeLevelFourItem = vm.levelFourList[0];
                }
                if (levelsDefined >= 5) {
                    vm.levelFiveList = vm.levelFourList[0].level5;
                    vm.activeLevelFiveItem = vm.levelFiveList[0];
                }
            }

            //#region setting the request object for getting roles and permission levels
            var rolesRequest = new Object;
            rolesRequest = {
                Url: configs.global.repositoryUrl
            }

            var permissionsRequest = new Object;
            permissionsRequest = {
                Url: configs.global.repositoryUrl
            }

            //#region for calling getting the role details
            vm.getRolesData = function () {
                vm.lazyloader = false;
                getRoles(rolesRequest, function (response) {
                    if (response != "") {
                        vm.clientlist = true;
                        vm.nodata = false;
                        vm.assignRoles = response;
                        vm.lazyloader = true;
                    } else {
                        vm.clientlist = false;
                        vm.nodata = true;
                        vm.lazyloader = true;
                    }
                });
            }
            //#endregion

            //#region for calling getting the role details
            vm.getPermissionsData = function () {
                vm.lazyloader = false;
                getPermissionLevels(permissionsRequest, function (response) {
                    if (response != "") {
                        vm.clientlist = true;
                        vm.nodata = false;
                        vm.assignPermissions = response;
                        vm.lazyloader = true;
                    } else {
                        vm.clientlist = false;
                        vm.nodata = true;
                        vm.lazyloader = true;
                    }
                });
            }
            //#endregion

            //#region for getting the users based on search values
            vm.searchUsers = function (val) {
                var searchUserRequest = {
                    Client: {
                        //Need to get the matter url from query string
                        Url: configs.global.repositoryUrl
                    },
                    SearchObject: {
                        SearchTerm: val
                    }
                };
                return settingsResource.getUsers(searchUserRequest).$promise;
            }
            //#endregion

            var siteCollectionPath = "";
            //#region for showing the selected clients Data
            vm.showSelectedClient = function (name, url) {
                vm.lazyloader = false;
                vm.selected = name;
                siteCollectionPath = url;
                vm.clienturl = url;
                vm.modifiedDate = '0';
                if (vm.isClientMappedWithHierachy) {
                    getClientsPracticeGroup(vm.selected);
                }
                getDefaultConfigurations(siteCollectionPath, function (response) {
                    if (response != "" && !response.isError) {
                        vm.configurations = JSON.parse(response.code);
                        vm.setClientData(vm.configurations);
                        vm.showrole = vm.configurations.ShowRole != null ? (vm.configurations.ShowRole == true ? "Yes" : "No") : "No";
                        vm.showmatterid = vm.configurations.ShowMatterId != null ? (vm.configurations.ShowMatterId == true ? "Yes" : "No") : "No";
                        vm.showAdditionalPropertiesDialogBox = vm.configurations.ShowAdditionalPropertiesDialogBox != null ? (vm.configurations.ShowAdditionalPropertiesDialogBox == true ? "Yes" : "No") : "No";
                        vm.nodata = false;
                        vm.lazyloader = true;
                        vm.clientlist = false;
                        vm.showClientDetails = true;
                        vm.additionalFieldValues = vm.configurations.AdditionalFieldValues ? vm.configurations.AdditionalFieldValues : {};
                        if (vm.configurations.DefaultMatterName != undefined) {
                            setNonBackwardCompatabilityClientData(response);
                        } else {
                            setBackwardCompatabilityClientData(response);
                        }

                    } else {
                        vm.nodata = true;
                        vm.lazyloader = true;
                        vm.error = response.value;
                        angular.element('#errorDiv').modal('show');
                    }
                });
            }
            //#endregion
            function setDefaultTaxonomyHierarchyLeveTwo(arrDMatterTypes, dPrimaryMatterType) {
                angular.forEach(vm.levelOneList, function (levelOneTerm) {
                    angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {
                        for (var iCount = 0; iCount < arrDMatterTypes.length; iCount++) {
                            if (levelTwoTerm.termName == arrDMatterTypes[iCount]) {
                                var documentType = levelTwoTerm;
                                documentType.levelOneFolderNames = levelOneTerm.folderNames;
                                documentType.levelOneTermId = levelOneTerm.id;
                                documentType.levelOneTermName = levelOneTerm.termName;
                                documentType.termChainName = levelOneTerm.termName;
                                if (vm.taxonomyHierarchyLevels >= 2) {
                                    documentType.levelTwoFolderNames = levelTwoTerm.folderNames;
                                    documentType.levelTwoTermId = levelTwoTerm.id;
                                    documentType.levelTwoTermName = levelTwoTerm.termName;
                                    documentType.termChainName = documentType.termChainName + ">" + documentType.levelTwoTermName;
                                }
                                vm.documentTypeLawTerms.push(documentType);
                                documentType.primaryMatterType = false;
                                if (levelTwoTerm.termName == dPrimaryMatterType) {
                                    documentType.primaryMatterType = true;
                                    vm.activeDocumentTypeLawTerm = levelTwoTerm;
                                }
                                vm.selectedDocumentTypeLawTerms.push(documentType);
                                getAdditionalMatterProperties(documentType);
                            }
                        }
                    });
                });
            }
            //
            function setDefaultTaxonomyHierarchyLevelThree(arrDMatterTypes, dPrimaryMatterType) {
                angular.forEach(vm.levelOneList, function (levelOneTerm) {
                    angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {
                        angular.forEach(levelTwoTerm.level3, function (levelThreeTerm) {
                            for (var iCount = 0; iCount < arrDMatterTypes.length; iCount++) {

                                if (levelThreeTerm.termName == arrDMatterTypes[iCount]) {
                                    var documentType = levelThreeTerm;
                                    documentType.levelOneFolderNames = levelOneTerm.folderNames;
                                    documentType.levelOneTermId = levelOneTerm.id;
                                    documentType.levelOneTermName = levelOneTerm.termName;
                                    documentType.termChainName = levelOneTerm.termName;
                                    if (vm.taxonomyHierarchyLevels >= 2) {
                                        documentType.levelTwoFolderNames = levelTwoTerm.folderNames;
                                        documentType.levelTwoTermId = levelTwoTerm.id;
                                        documentType.levelTwoTermName = levelTwoTerm.termName;
                                        documentType.termChainName = documentType.termChainName + ">" + documentType.levelTwoTermName;
                                    }
                                    if (vm.taxonomyHierarchyLevels >= 3) {
                                        documentType.levelThreeFolderNames = levelThreeTerm.folderNames;
                                        documentType.levelThreeId = levelThreeTerm.id;
                                        documentType.levelThreeTermName = levelThreeTerm.termName;
                                        documentType.termChainName = documentType.termChainName + ">" + documentType.levelThreeTermName;
                                    }
                                    vm.documentTypeLawTerms.push(documentType);
                                    documentType.primaryMatterType = false;
                                    if (levelThreeTerm.termName == dPrimaryMatterType) {
                                        documentType.primaryMatterType = true;
                                        vm.activeDocumentTypeLawTerm = levelThreeTerm;
                                    }
                                    vm.selectedDocumentTypeLawTerms.push(documentType);
                                    getAdditionalMatterProperties(documentType);
                                }
                            }
                        });
                    });
                });
            }
            function setDefaultTaxonomyHierarchyLevelFour(arrDMatterTypes, dPrimaryMatterType) {
                angular.forEach(vm.levelOneList, function (levelOneTerm) {
                    angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {

                        angular.forEach(levelTwoTerm.level3, function (levelThreeTerm) {
                            angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                for (var iCount = 0; iCount < arrDMatterTypes.length; iCount++) {

                                    if (levelFourTerm.termName == arrDMatterTypes[iCount]) {
                                        var documentType = levelFourTerm;
                                        documentType.levelOneFolderNames = levelOneTerm.folderNames;
                                        documentType.levelOneTermId = levelOneTerm.id;
                                        documentType.levelOneTermName = levelOneTerm.termName;
                                        documentType.termChainName = levelOneTerm.termName;
                                        if (vm.taxonomyHierarchyLevels >= 2) {
                                            documentType.levelTwoFolderNames = levelTwoTerm.folderNames;
                                            documentType.levelTwoTermId = levelTwoTerm.id;
                                            documentType.levelTwoTermName = levelTwoTerm.termName;
                                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelTwoTermName;
                                        }
                                        if (vm.taxonomyHierarchyLevels >= 3) {
                                            documentType.levelThreeFolderNames = levelThreeTerm.folderNames;
                                            documentType.levelThreeId = levelThreeTerm.id;
                                            documentType.levelThreeTermName = levelThreeTerm.termName;
                                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelThreeTermName;
                                        }
                                        if (vm.taxonomyHierarchyLevels >= 4) {
                                            documentType.levelFourFolderNames = levelFourTerm.folderNames;
                                            documentType.levelFourId = levelFourTerm.id;
                                            documentType.levelFourTermName = levelFourTerm.termName;
                                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelFourTermName;
                                        }

                                        vm.documentTypeLawTerms.push(documentType);
                                        documentType.primaryMatterType = false;
                                        if (levelFourTerm.termName == dPrimaryMatterType) {
                                            documentType.primaryMatterType = true;
                                            vm.activeDocumentTypeLawTerm = levelFourTerm;
                                        }
                                        vm.selectedDocumentTypeLawTerms.push(documentType);
                                        getAdditionalMatterProperties(documentType);
                                    }
                                }
                            });
                        });
                    });
                });
            }
            function setDefaultTaxonomyHierarchyLevelFive(arrDMatterTypes, dPrimaryMatterType) {
                angular.forEach(vm.levelOneList, function (levelOneTerm) {
                    angular.forEach(levelOneTerm.level2, function (levelTwoTerm) {

                        angular.forEach(levelTwoTerm.level3, function (levelThreeTerm) {
                            angular.forEach(levelThreeTerm.level4, function (levelFourTerm) {
                                angular.forEach(levelFourTerm.level5, function (levelFiveTerm) {
                                    for (var iCount = 0; iCount < arrDMatterTypes.length; iCount++) {

                                        if (levelFiveTerm.termName == arrDMatterTypes[iCount]) {
                                            var documentType = levelFiveTerm;
                                            documentType.levelOneFolderNames = levelOneTerm.folderNames;
                                            documentType.levelOneTermId = levelOneTerm.id;
                                            documentType.levelOneTermName = levelOneTerm.termName;
                                            documentType.termChainName = levelOneTerm.termName;
                                            if (vm.taxonomyHierarchyLevels >= 2) {
                                                documentType.levelTwoFolderNames = levelTwoTerm.folderNames;
                                                documentType.levelTwoTermId = levelTwoTerm.id;
                                                documentType.levelTwoTermName = levelTwoTerm.termName;
                                                documentType.termChainName = documentType.termChainName + ">" + documentType.levelTwoTermName;
                                            }
                                            if (vm.taxonomyHierarchyLevels >= 3) {
                                                documentType.levelThreeFolderNames = levelThreeTerm.folderNames;
                                                documentType.levelThreeId = levelThreeTerm.id;
                                                documentType.levelThreeTermName = levelThreeTerm.termName;
                                                documentType.termChainName = documentType.termChainName + ">" + documentType.levelThreeTermName;
                                            }
                                            if (vm.taxonomyHierarchyLevels >= 4) {
                                                documentType.levelFourFolderNames = levelFourTerm.folderNames;
                                                documentType.levelFourId = levelFourTerm.id;
                                                documentType.levelFourTermName = levelFourTerm.termName;
                                                documentType.termChainName = documentType.termChainName + ">" + documentType.levelFourTermName;
                                            }
                                            if (vm.taxonomyHierarchyLevels >= 5) {
                                                documentType.levelFiveFolderNames = levelFiveTerm.folderNames;
                                                documentType.levelFiveId = levelFiveTerm.id;
                                                documentType.levelFiveTermName = levelFiveTerm.termName;
                                                documentType.termChainName = documentType.termChainName + ">" + documentType.levelFiveTermName;
                                            }
                                            vm.documentTypeLawTerms.push(documentType);
                                            documentType.primaryMatterType = false;
                                            if (levelFiveTerm.termName == dPrimaryMatterType) {
                                                documentType.primaryMatterType = true;
                                                vm.activeDocumentTypeLawTerm = levelFiveTerm;
                                            }
                                            vm.selectedDocumentTypeLawTerms.push(documentType);
                                            getAdditionalMatterProperties(documentType);
                                        }
                                    }
                                });
                            });
                        });
                    });
                });
            }

            //#region for setting the selected client values to ng-models
            vm.setClientData = function (data) {
                vm.mattername = data.DefaultMatterName != undefined ? data.DefaultMatterName : data.DefaultProjectName != undefined ? data.DefaultProjectName : "";
                vm.matterid = data.DefaultMatterId != undefined ? data.DefaultMatterId : "";
                if (data.IsRestrictedAccessSelected) {
                    vm.assignteam = "Yes";
                } else {
                    vm.assignteam = "No";
                }
                if (data.IsCalendarSelected) {
                    vm.calendar = "Yes";
                } else {
                    vm.calendar = "No";
                }
                if (data.IsRSSSelected) {
                    vm.rss = "Yes";
                } else {
                    vm.rss = "No";
                }
                if (data.IsEmailOptionSelected) {
                    vm.email = "Yes";
                } else {
                    vm.email = "No";
                }
                if (data.IsTaskSelected) {
                    vm.tasks = "Yes";
                } else {
                    vm.tasks = "No";
                }
                if (data.IsMatterDescriptionMandatory != undefined && data.IsMatterDescriptionMandatory) {
                    vm.matterdesc = "Yes";
                } else {
                    if (data.IsProjectDescriptionMandatory != undefined && data.IsProjectDescriptionMandatory) {
                        vm.matterdesc = "Yes";
                    } else {
                        vm.matterdesc = "No";
                    }
                }
                if (data.IsConflictCheck) {
                    vm.conflict = "Yes";
                } else {
                    vm.conflict = "No";
                }

                vm.showmatterconfiguration = "DateTime"
                if (data.MatterIdType !== undefined && data.MatterIdType !== null) {
                    vm.showmatterconfiguration = data.MatterIdType
                }
            }
            //#endregion

            //#region for showing the settings div
            vm.showSetting = function () {
                vm.clientlist = true;
                vm.showClientDetails = false;
                vm.successmessage = false;
            }
            //#endregion

            //#region for adding more users to assign permissions
            vm.addNewAssignPermissions = function () {
                var newItemNo = vm.assignPermissionTeams.length + 1;
                vm.assignPermissionTeams.push({ 'assignedUser': '', 'assigneTeamRowNumber': newItemNo, 'assignedRole': vm.assignRoles[0], 'assignedPermission': vm.assignPermissions[0] });
            };
            //#endregion

            //#region for removing the added users
            vm.removeAssignPermissionsRow = function (index) {
                var remainingRows = vm.assignPermissionTeams.length;
                if (1 < remainingRows) {
                    vm.assignPermissionTeams.splice(index, 1);

                }
            };
            //#endregion

            //#region for selecting the typehead values into the input with additional changes
            vm.onSelect = function ($item, $model, $label, value, fucnValue, $event) {
                if ($item && $item.name !== "No results found") {
                    if (value == "team") {
                        $label.assignedUser = $item.name + '(' + $item.email + ')';
                    }
                }
            }
            //#endregion


            function getAllSelectedDocumentTemplates() {
                var oSelectedDocuments = {
                    defaultMatterType: "",
                    matterTypes: ""
                }

                angular.forEach(vm.selectedDocumentTypeLawTerms, function (singleTerm) {
                    if (oSelectedDocuments.matterTypes == "") {
                        oSelectedDocuments.matterTypes = singleTerm.termName;
                    } else {
                        oSelectedDocuments.matterTypes = oSelectedDocuments.matterTypes + "$|$" + singleTerm.termName;
                    }
                    if (singleTerm.primaryMatterType) {
                        oSelectedDocuments.defaultMatterType = singleTerm.termName;
                    }
                });
                return oSelectedDocuments;
            }

            //#region get Users data

            var getUserName = function (sUserEmails, bIsName) {
                "use strict";
                var oEmailRegexp= /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                var arrUserNames = [], arrTempUserNames = [], sEmail = "", oEmailRegex = new RegExp(oEmailRegexp);
                if (sUserEmails && null !== sUserEmails && "" !== sUserEmails) {
                    arrUserNames = sUserEmails.split(";");
                    for (var iIterator = 0; iIterator < arrUserNames.length - 1; iIterator++) {
                        if (arrUserNames[iIterator] && null !== arrUserNames[iIterator] && "" !== arrUserNames[iIterator]) {
                            if (-1 !== arrUserNames[iIterator].lastIndexOf("(")) {
                                sEmail = $.trim(arrUserNames[iIterator].substring(arrUserNames[iIterator].lastIndexOf("(") + 1, arrUserNames[iIterator].lastIndexOf(")")));
                                if (oEmailRegex.test(sEmail)) {
                                    arrUserNames[iIterator] = bIsName ? $.trim(arrUserNames[iIterator].substring(0, arrUserNames[iIterator].lastIndexOf("("))) : sEmail;
                                }
                            }
                        }
                    }
                }
                angular.forEach(arrUserNames, function (user) {
                    if (user != '') {
                        arrTempUserNames.push(user)
                    }
                });

                return arrTempUserNames;
            }

            function getArrAssignedUserNamesAndEmails() {
                vm.arrAssignedUserName = [], vm.arrAssignedUserEmails = [], vm.userIDs = [];
                var count = 1;
                angular.forEach(vm.assignPermissionTeams, function (team) { //For loop
                    vm.arrAssignedUserName.push(getUserName(team.assignedUser + ";", true));
                    vm.arrAssignedUserEmails.push(getUserName(team.assignedUser + ";", false));
                    vm.userIDs.push("txtAssign" + count++);
                });
            }

            function getAssignedUserRoles() {
                "use strict";
                var arrAssigneTeams = vm.assignPermissionTeams, nCount = 0, nlength, arrRoles = [];
                if (arrAssigneTeams) {
                    nlength = arrAssigneTeams.length;
                    for (nCount = 0; nCount < nlength; nCount++) {
                        if (arrAssigneTeams[nCount] && arrAssigneTeams[nCount].assignedRole) {
                            if (arrAssigneTeams[nCount].assignedRole && arrAssigneTeams[nCount].assignedRole.name) {
                                if ("" !== arrAssigneTeams[nCount].assignedRole.name) {
                                    arrRoles.push(arrAssigneTeams[nCount].assignedRole.name);
                                }
                            }
                        }
                    }
                }
                return arrRoles;
            }

            function getAssignedUserPermissions() {
                "use strict";
                var arrAssigneTeams = vm.assignPermissionTeams, nCount = 0, nlength, arrAssignRoles, arrPermissions = [];
                if (arrAssigneTeams) {
                    nlength = arrAssigneTeams.length;
                    for (nCount = 0; nCount < nlength; nCount++) {
                        if (arrAssigneTeams[nCount] && arrAssigneTeams[nCount].assignedPermission) {
                            if (arrAssigneTeams[nCount].assignedPermission && arrAssigneTeams[nCount].assignedPermission.name) {
                                if ("" !== arrAssigneTeams[nCount].assignedPermission.name) {
                                    arrPermissions.push(arrAssigneTeams[nCount].assignedPermission.name);
                                }
                            }
                        }
                    }
                }
                return arrPermissions;
            }
            //#endregion

            //#region for saving the settings
            vm.saveSettings = function () {
                vm.popupContainerBackground = "show";
                getArrAssignedUserNamesAndEmails();
                var arrRolesData = getAssignedUserRoles();
                var arrPermData = getAssignedUserPermissions();
                var strUserNames = vm.arrAssignedUserName.join('$|$').replace(',', "");
                var strUserEmails = vm.arrAssignedUserEmails.join('$|$').replace(',', "");
                var strRoles = arrRolesData.join('$|$');
                var strPermissions = arrPermData.join('$|$');
                vm.lazyloader = false;
                var oSelectedDocumentTemplates = getAllSelectedDocumentTemplates();
                var sLevel1List = "", sLevel2List = "", sLevel3List = "", sLevel4List = "", sLevel5List = "";
                angular.forEach(vm.selectedDocumentTypeLawTerms, function (item) {
                    if (vm.taxonomyHierarchyLevels >= 2) {
                        if (sLevel1List == "") {
                            sLevel1List = item.levelOneTermName;
                        } else {
                            sLevel1List = sLevel1List + "$|$" + item.levelOneTermName;
                        }
                        if (sLevel2List == "") {
                            sLevel2List = item.levelTwoTermName;
                        } else {
                            sLevel2List = sLevel2List + "$|$" + item.levelTwoTermName;
                        }

                    }
                    if (vm.taxonomyHierarchyLevels >= 3) {
                        if (sLevel3List == "") {
                            sLevel3List = item.levelThreeTermName;
                        } else {
                            sLevel3List = sLevel3List + "$|$" + item.levelThreeTermName;
                        }
                    }
                    if (vm.taxonomyHierarchyLevels >= 4) {
                        if (sLevel4List == "") {
                            sLevel4List = item.levelFourTermName;
                        } else {
                            sLevel4List = sLevel4List + "$|$" + item.levelFourTermName;
                        }

                    }
                    if (vm.taxonomyHierarchyLevels >= 5) {
                        if (sLevel5List == "") {
                            sLevel5List = item.levelFiveTermName;
                        } else {
                            sLevel5List = sLevel5List + "$|$" + item.levelFiveTermName;
                        }
                    }
                });

                var managedColumns = {}
                for (var i = 0; i < vm.taxonomyHierarchyLevels; i++) {
                    var columnName = configs.contentTypes.managedColumns["ColumnName" + (i + 1)];
                    managedColumns[columnName] = { TermName: "", Id: "" };
                    if (i === 0) { managedColumns[columnName].TermName = sLevel1List; }
                    if (i === 1) { managedColumns[columnName].TermName = sLevel2List; }
                    if (i === 2) { managedColumns[columnName].TermName = sLevel3List; }
                    if (i === 3) { managedColumns[columnName].TermName = sLevel4List; }
                    if (i === 4) { managedColumns[columnName].TermName = sLevel5List; }
                }
                var additionalFieldValues = getExtraMatterFieldValues();
                var settingsRequest = {
                    DefaultMatterName: vm.mattername,
                    DefaultMatterId: vm.matterid,
                    DefaultMatterType: oSelectedDocumentTemplates.defaultMatterType,
                    MatterTypes: oSelectedDocumentTemplates.matterTypes,
                    MatterUsers: strUserNames,
                    MatterUserEmails: strUserEmails,
                    MatterRoles: strRoles,
                    MatterPermissions: strPermissions,
                    IsCalendarSelected: vm.getBoolValues(vm.calendar),
                    IsEmailOptionSelected: vm.getBoolValues(vm.email),
                    IsRSSSelected: vm.getBoolValues(vm.rss),
                    IsRestrictedAccessSelected: vm.getBoolValues(vm.assignteam),
                    IsConflictCheck: vm.getBoolValues(vm.conflict),
                    IsMatterDescriptionMandatory: vm.getBoolValues(vm.matterdesc),
                    MatterPracticeGroup: sLevel1List,
                    MatterAreaofLaw: sLevel2List,
                    IsContentCheck: vm.getBoolValues("Yes"),
                    IsTaskSelected: vm.getBoolValues(vm.tasks),
                    ClientUrl: vm.clienturl,
                    CachedItemModifiedDate: vm.cacheItemModifiedDate,
                    UserId: vm.userIDs,
                    ShowRole: vm.getBoolValues(vm.showrole),
                    ShowMatterId: vm.getBoolValues(vm.showmatterid),
                    MatterIdType: vm.showmatterconfiguration,
                    AdditionalFieldValues: additionalFieldValues,
                    ShowAdditionalPropertiesDialogBox: vm.getBoolValues(vm.showAdditionalPropertiesDialogBox)
                }
                saveConfigurations(settingsRequest, function (response) {
                    if (response != "") {
                        vm.lazyloader = true;
                        vm.clientlist = false;
                        vm.showClientDetails = true;
                        vm.cacheItemModifiedDate = response.value;
                        vm.successmessage = true;
                        vm.popupContainerBackground = "hide";
                    } else {
                        vm.nodata = true;
                        vm.lazyloader = true;
                        vm.successmessage = false;
                        vm.popupContainerBackground = "hide";
                    }
                });
            }
            //#endregion

            //#region for setting matter Id values
            vm.showMatterId = function () {
                vm.showmatterid == 'Yes';
                vm.showmatterconfiguration = vm.settingsConfigs.Radio2Option1Text;
            }
            //#endegion

            //#region to get bool values
            vm.getBoolValues = function (value) {
                var boolvalue = false;
                if (value == "Yes") {
                    boolvalue = true;
                }
                return boolvalue;
            }

            vm.selectMatterTypePopUpClose = function () {
                if (vm.popupContainer == "Show") {
                    vm.saveDocumentTemplates();
                }
            }

            vm.selectMatterType = function (value) {
                vm.popupContainer = "Show";
                vm.popupContainerBackground = "Show";
                $timeout(function () {
                    angular.element("#pgDropDownEle").focus();
                    
                }, 10);
            }

            vm.addToDocumentTemplate = function () {
                var isThisNewDocTemplate = true;
                var selectedHighestLevelItem = null;
                vm.primaryMatterType = false;
                switch (vm.taxonomyHierarchyLevels) {
                    case 2:
                        selectedHighestLevelItem = vm.activeLevelTwoItem;
                        makeDisableSelectedItemInColumn(vm.levelTwoList, selectedHighestLevelItem);
                        break;
                    case 3:
                        selectedHighestLevelItem = vm.activeLevelThreeItem;
                        makeDisableSelectedItemInColumn(vm.levelThreeList, selectedHighestLevelItem);
                        break;
                    case 4:
                        selectedHighestLevelItem = vm.activeLevelFourItem;
                        makeDisableSelectedItemInColumn(vm.levelFourList, selectedHighestLevelItem);
                        break;
                    case 5:
                        selectedHighestLevelItem = vm.activeLevelFiveItem;
                        makeDisableSelectedItemInColumn(vm.levelFiveList, selectedHighestLevelItem);
                        break;

                }
                if (selectedHighestLevelItem != null) {
                    angular.forEach(vm.documentTypeLawTerms, function (term) { //For loop
                        if (selectedHighestLevelItem.id == term.id) {// this line will check whether the data is existing or not
                            isThisNewDocTemplate = false;
                        }
                    });
                    if (isThisNewDocTemplate) {

                        var documentType = selectedHighestLevelItem;
                        documentType.levelOneFolderNames = vm.selectedLevelOneItem.folderNames;
                        documentType.levelOneTermId = vm.selectedLevelOneItem.id;
                        documentType.levelOneTermName = vm.selectedLevelOneItem.termName;
                        documentType.termChainName = vm.selectedLevelOneItem.termName;
                        if (vm.taxonomyHierarchyLevels >= 2) {
                            documentType.levelTwoFolderNames = vm.activeLevelTwoItem.folderNames;
                            documentType.levelTwoTermId = vm.activeLevelTwoItem.id;
                            documentType.levelTwoTermName = vm.activeLevelTwoItem.termName;
                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelTwoTermName;
                        }
                        if (vm.taxonomyHierarchyLevels >= 3) {
                            documentType.levelThreeFolderNames = vm.activeLevelThreeItem.folderNames;
                            documentType.levelThreeId = vm.activeLevelThreeItem.id;
                            documentType.levelThreeTermName = vm.activeLevelThreeItem.termName;
                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelThreeTermName;
                        }
                        if (vm.taxonomyHierarchyLevels >= 4) {
                            documentType.levelFourFolderNames = vm.activeLevelFourItem.folderNames;
                            documentType.levelFourId = vm.activeLevelFourItem.id;
                            documentType.levelFourTermName = vm.activeLevelFourItem.termName;
                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelFourTermName;
                        }
                        if (vm.taxonomyHierarchyLevels >= 5) {
                            documentType.levelFiveFolderNames = vm.activeLevelFiveItem.folderNames;
                            documentType.levelFiveId = vm.activeLevelFiveItem.id;
                            documentType.levelFiveTermName = vm.activeLevelFiveItem.termName;
                            documentType.termChainName = documentType.termChainName + ">" + documentType.levelFiveTermName;
                        }
                        vm.documentTypeLawTerms.push(documentType);
                        vm.activeDocumentTypeLawTerm = null;
                    }
                }
            }

            function makeDisableSelectedItemInColumn(levelList, selectedItem) {
                angular.forEach(levelList, function (levelListItem) {
                    if (levelListItem.termName == selectedItem.termName) {
                        levelListItem.state = "disable";
                    }

                });
            }

            function makeEnableSelectedItemInColumn(selectedItem) {
                var levelList = [];
                if (vm.taxonomyHierarchyLevels == 2) {
                    levelList = vm.levelTwoList;
                }
                if (vm.taxonomyHierarchyLevels == 3) {
                    levelList = vm.levelThreeList;
                }
                if (vm.taxonomyHierarchyLevels == 4) {
                    levelList = vm.levelFourList;
                }
                if (vm.taxonomyHierarchyLevels == 5) {
                    levelList = vm.levelFiveList;
                }

                angular.forEach(levelList, function (levelListItem) {
                    if (levelListItem.termName == selectedItem.termName) {
                        levelListItem.state = "enable";
                    }

                });
            }

            vm.removeFromDocumentTemplate = function () {
                if (vm.removeDTItem) {
                    var index = vm.documentTypeLawTerms.indexOf(vm.activeDocumentTypeLawTerm);
                    makeEnableSelectedItemInColumn(vm.activeDocumentTypeLawTerm);
                    vm.documentTypeLawTerms.splice(index, 1);
                    vm.removeDTItem = false;
                    vm.primaryMatterType = false;
                    vm.activeDocumentTypeLawTerm = null;
                }
            }

            vm.selectDocumentTemplateTypeLawTerm = function (documentTemplateTypeLawTerm) {
                if (documentTemplateTypeLawTerm != null) {
                    vm.errorPopUp = false;;
                    vm.removeDTItem = true;
                    vm.activeDocumentTypeLawTerm = documentTemplateTypeLawTerm;
                    vm.primaryMatterType = true;
                }
            }

            vm.saveDocumentTemplates = function () {

                if (vm.primaryMatterType) {
                    vm.errorPopUp = false;
                    angular.forEach(vm.documentTypeLawTerms, function (term) {
                        var primaryType = false;
                        if (vm.activeDocumentTypeLawTerm.id == term.id) {// this line will check whether the data is existing or not
                            primaryType = true;
                            // To check Extra Properties content type is present in -
                            // changed sub area of law.
                            getAdditionalMatterProperties(term);  
                        }
                        term.primaryMatterType = primaryType;
                        vm.popupContainerBackground = "hide";
                        vm.popupContainer = "hide";
                    });
                    vm.selectedDocumentTypeLawTerms = vm.documentTypeLawTerms;
                }
                else {
                    if (vm.documentTypeLawTerms.length >= 0) {
                        vm.errorPopUp = true;
                        $timeout(function () { angular.element('#errMatterType').focus(); }, 500);
                    } else {
                        vm.popupContainerBackground = "hide";
                        vm.popupContainer = "hide";
                    }
                }
            }

            vm.documentTypeLawTerms = [];
            vm.getSelectedLevelOne = function () {
                if (vm.selectedLevelOneItem != null) {
                    if (vm.taxonomyHierarchyLevels >= 2) {
                        vm.levelTwoList = [];
                        vm.levelTwoList = vm.selectedLevelOneItem.level2;
                        vm.activeLevelTwoItem = vm.selectedLevelOneItem.level2[0];
                    }
                    if (vm.taxonomyHierarchyLevels >= 3) {
                        vm.levelThreeList = [];
                        vm.levelThreeList = vm.levelTwoList[0].level3;
                        vm.activeLevelThreeItem = vm.levelThreeList[0];
                    }
                    if (vm.taxonomyHierarchyLevels >= 4) {
                        vm.levelFourList = [];
                        vm.levelFourList = vm.levelThreeList[0].level4;
                        vm.activeLevelFourItem = (vm.levelFourList && vm.levelFourList[0] != undefined) ? vm.levelFourList[0] : [];
                    }
                    if (vm.taxonomyHierarchyLevels >= 5) {
                        vm.levelFiveList = [];
                        vm.levelFiveList = vm.levelFourList[0].level5;
                        vm.activeLevelFiveItem = (vm.levelFiveList && vm.levelFiveList[0] != undefined) ? vm.levelFiveList[0] : [];
                    }
                    vm.errorPopUp = false;
                } else {
                    vm.levelTwoList = vm.levelThreeList = null;
                    if (vm.taxonomyHierarchyLevels >= 2) {
                        vm.levelTwoList = null;

                    }
                    if (vm.taxonomyHierarchyLevels >= 3) {
                        vm.levelThreeList = null;
                    }
                    if (vm.taxonomyHierarchyLevels >= 4) {
                        vm.levelFourList = null;
                    }
                    if (vm.taxonomyHierarchyLevels >= 5) {
                        vm.levelFiveList = null;
                    }
                }
            }

            // function to get the subAOL items on selection of AOLTerm
            vm.selectLevelTwoItem = function (levelTwoItem) {
                vm.errorPopUp = false;
                vm.activeLevelTwoItem = levelTwoItem;
                if (vm.taxonomyHierarchyLevels >= 3) {
                    vm.levelThreeList = vm.activeLevelTwoItem.level3;
                    vm.activeLevelThreeItem = vm.levelThreeList[0];
                }
                if (vm.taxonomyHierarchyLevels >= 4) {
                    vm.levelFourList = vm.levelThreeList[0] != undefined && vm.levelThreeList[0].level4 ? vm.levelThreeList[0].level4 : [];
                    vm.activeLevelFourItem = vm.levelFourList[0] != undefined ? vm.levelFourList[0] : [];
                }
                if (vm.taxonomyHierarchyLevels >= 5) {
                    vm.levelFiveList = vm.levelFourList[0] != undefined && vm.levelFourList[0].level5 ? vm.levelFourList[0].level5 : [];
                    vm.activeLevelFiveItem = vm.levelFourList[0] != undefined ? vm.levelFiveList[0] : [];
                }
            }
            //function to for seclection of subAOL items 
            vm.selectLevelThreeItem = function (levelThreeItem) {
                vm.errorPopUp = false;
                vm.activeLevelThreeItem = levelThreeItem;
                if (vm.taxonomyHierarchyLevels >= 4) {
                    vm.levelFourList = vm.activeLevelThreeItem != undefined ? vm.activeLevelThreeItem.level4 : [];
                    vm.activeLevelFourItem = (vm.levelFourList != undefined && vm.levelFourList[0] != undefined) ? vm.levelFourList[0] : [];
                }
                if (vm.taxonomyHierarchyLevels >= 5) {
                    vm.levelFiveList = (vm.levelFourList != undefined && vm.levelFourList[0] != undefined && vm.levelFourList[0].level5) ? vm.levelFourList[0].level5 : [];
                    vm.activeLevelFiveItem = (vm.levelFourList != undefined && vm.levelFourList[0] != undefined) ? vm.levelFiveList[0] : [];
                }
            }

            vm.selectLevelFourItem = function (levelFourItem) {
                vm.errorPopUp = false;
                vm.activeLevelFourItem = levelFourItem;
                if (vm.taxonomyHierarchyLevels >= 5) {
                    vm.levelFiveList = vm.activeLevelFourItem.level5;
                    vm.activeLevelFiveItem = vm.levelFiveList[0];
                }

            }
            vm.selectLevelFiveItem = function (levelFiveItem) {
                vm.errorPopUp = false;
                vm.activeLevelFiveItem = levelFiveItem;
            }

            function setBackwardCompatabilityClientData(data) {
                var arrDMatterUsers = [];
                var arrDMatterUserEmails = [];
                var arrDMatterRoles = [];
                var arrDMatterPermissions = [];

                if (vm.configurations.ProjectUsers != undefined && vm.configurations.ProjectUsers != "") {
                    arrDMatterUsers = vm.configurations.ProjectUsers.split('$|$');
                }

                if (vm.configurations.ProjectUserEmails != undefined && vm.configurations.ProjectUserEmails != "") {
                    arrDMatterUserEmails = vm.configurations.ProjectUserEmails.split('$|$');
                }
                if (vm.configurations.MatterRoles != undefined && vm.configurations.MatterRoles != "") {
                    arrDMatterRoles = vm.configurations.MatterRoles.split('$|$');
                }

                if (vm.configurations.ProjectPermissions != undefined && vm.configurations.ProjectPermissions != "") {
                    arrDMatterPermissions = vm.configurations.ProjectPermissions.split('$|$');
                }
                vm.assignPermissionTeams = [];
                for (var aCount = 0; aCount < arrDMatterUsers.length; aCount++) {
                    var assignPermTeam = {};
                    if ("" !== arrDMatterUsers[aCount]) {
                        arrDMatterUsers[aCount] = arrDMatterUsers[aCount].replace(/\;$/, '');
                        arrDMatterUserEmails[aCount] = arrDMatterUserEmails[aCount].replace(/\;$/, '');
                        assignPermTeam.assignedUser = arrDMatterUsers[aCount] + "(" + arrDMatterUserEmails[aCount] + ")";
                    }
                    else {
                        assignPermTeam.assignedUser = "";
                        assignPermTeam.assignedRole = vm.assignRoles[0];
                        assignPermTeam.assignedPermission = vm.assignPermissions[0];
                    }
                    angular.forEach(vm.assignRoles, function (assignRole) {
                        if (arrDMatterRoles[aCount] == assignRole.name) {
                            assignPermTeam.assignedRole = assignRole;
                        }
                    });

                    angular.forEach(vm.assignPermissions, function (assignPermission) {
                        if (arrDMatterPermissions[aCount] == assignPermission.name) {
                            assignPermTeam.assignedPermission = assignPermission;
                        }
                    });
                    if (assignPermTeam.assignedRole == undefined) {
                        assignPermTeam.assignedRole = vm.assignRoles[0];
                    }
                    if (assignPermTeam.assignedPermission == undefined) {
                        assignPermTeam.assignedPermission = vm.assignPermissions[0];
                    }
                    assignPermTeam.assigneTeamRowNumber = aCount + 1;

                    vm.assignPermissionTeams.push(assignPermTeam);

                }
                if (vm.assignPermissionTeams.length == 0) {
                    vm.addNewAssignPermissions();
                }
                var arrDMatterAreaOfLaw = [];
                var dMatterTypes = "", dPrimaryMatterType = "";
                var arrDMatterPracticeGroup = [];
                arrDMatterAreaOfLaw = vm.selected;

                if (vm.configurations.ProjectPracticeGroup != "") {
                    arrDMatterPracticeGroup = vm.configurations.ProjectPracticeGroup.split('$|$');
                }
                dMatterTypes = vm.configurations.ProjectTypes ? vm.configurations.ProjectTypes : "";
                var arrDMatterTypes = [];
                if (dMatterTypes) {
                    arrDMatterTypes = dMatterTypes.split('$|$');
                }
                dPrimaryMatterType = vm.configurations.DefaultProjectType ? vm.configurations.DefaultProjectType : "";
                vm.primaryMatterType = dPrimaryMatterType != "" ? true : false;
                vm.selectedDocumentTypeLawTerms = [];
                vm.documentTypeLawTerms = [];
                if (vm.taxonomyHierarchyLevels == 2) {
                    setDefaultTaxonomyHierarchyLeveTwo(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 3) {
                    setDefaultTaxonomyHierarchyLevelThree(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 4) {
                    setDefaultTaxonomyHierarchyLevelFour(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 5) {
                    setDefaultTaxonomyHierarchyLevelFive(arrDMatterTypes, dPrimaryMatterType);
                }

                if (vm.modifiedDate === data.value)
                    vm.cacheItemModifiedDate = vm.modifiedDate;
                else
                    vm.cacheItemModifiedDate = data.value;
            }
            ///setting data for backwardcompatibility false
            function setNonBackwardCompatabilityClientData(data) {
                var arrDMatterUsers = [];
                var arrDMatterUserEmails = [];
                var arrDMatterRoles = [];
                var arrDMatterPermissions = [];
                if (vm.configurations.MatterUsers != undefined && vm.configurations.MatterUsers != "") {
                    arrDMatterUsers = vm.configurations.MatterUsers.split('$|$');
                }

                if (vm.configurations.MatterUserEmails != undefined && vm.configurations.MatterUserEmails != "") {
                    arrDMatterUserEmails = vm.configurations.MatterUserEmails.split('$|$');
                }

                if (vm.configurations.MatterRoles != undefined && vm.configurations.MatterRoles != "") {
                    arrDMatterRoles = vm.configurations.MatterRoles.split('$|$');
                }

                if (vm.configurations.MatterPermissions != undefined && vm.configurations.MatterPermissions != "") {
                    arrDMatterPermissions = vm.configurations.MatterPermissions.split('$|$');
                }

                vm.assignPermissionTeams = [];

                for (var aCount = 0; aCount < arrDMatterUsers.length; aCount++) {
                    var assignPermTeam = {};
                    if ("" !== arrDMatterUsers[aCount]) {
                        arrDMatterUsers[aCount] = arrDMatterUsers[aCount].replace(/\;$/, '');
                        arrDMatterUserEmails[aCount] = arrDMatterUserEmails[aCount].replace(/\;$/, '');
                        assignPermTeam.assignedUser = arrDMatterUsers[aCount] + "(" + arrDMatterUserEmails[aCount] + ")";
                    }
                    else {
                        assignPermTeam.assignedUser = "";
                        assignPermTeam.assignedRole = vm.assignRoles[0];
                        assignPermTeam.assignedPermission = vm.assignPermissions[0];
                    }

                    angular.forEach(vm.assignRoles, function (assignRole) {
                        if (arrDMatterRoles[aCount] == assignRole.name) {
                            assignPermTeam.assignedRole = assignRole;
                        }
                    });
                    angular.forEach(vm.assignPermissions, function (assignPermission) {
                        if (arrDMatterPermissions[aCount] == assignPermission.name) {
                            assignPermTeam.assignedPermission = assignPermission;
                        }
                    });
                    assignPermTeam.assigneTeamRowNumber = aCount + 1;

                    vm.assignPermissionTeams.push(assignPermTeam);

                }
                if (vm.assignPermissionTeams.length == 0) {
                    vm.addNewAssignPermissions();
                }
                var arrDMatterAreaOfLaw = [];
                var dMatterTypes = "", dPrimaryMatterType = "";
                var arrDMatterPracticeGroup = [];
                if (vm.configurations.MatterAreaofLaw != "") {
                    arrDMatterAreaOfLaw = vm.configurations.MatterAreaofLaw.split('$|$');
                }
                if (vm.configurations.MatterPracticeGroup != "") {
                    arrDMatterPracticeGroup = vm.configurations.MatterPracticeGroup.split('$|$');
                }

                dMatterTypes = vm.configurations.MatterTypes ? vm.configurations.MatterTypes : "";
                var arrDMatterTypes = [];
                if (dMatterTypes) {
                    arrDMatterTypes = dMatterTypes.split('$|$');
                }
                dPrimaryMatterType = vm.configurations.DefaultMatterType ? vm.configurations.DefaultMatterType : "";
                vm.primaryMatterType = dPrimaryMatterType != "" ? true : false;
                vm.selectedDocumentTypeLawTerms = [];
                vm.documentTypeLawTerms = [];
                if (vm.taxonomyHierarchyLevels == 2) {
                    setDefaultTaxonomyHierarchyLeveTwo(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 3) {
                    setDefaultTaxonomyHierarchyLevelThree(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 4) {
                    setDefaultTaxonomyHierarchyLevelFour(arrDMatterTypes, dPrimaryMatterType);
                }
                if (vm.taxonomyHierarchyLevels == 5) {
                    setDefaultTaxonomyHierarchyLevelFive(arrDMatterTypes, dPrimaryMatterType);
                }

                if (vm.modifiedDate === data.value)
                    vm.cacheItemModifiedDate = vm.modifiedDate;
                else
                    vm.cacheItemModifiedDate = data.value;
            }

            //function to filter practice groups
            function getClientsPracticeGroup(clientName) {
                if (clientName && clientName != null && clientName != "") {
                    var levelOneList = [];
                    var pgTermList = vm.parentLevelOneList.level1;

                    angular.forEach(pgTermList, function (pgTerm) {
                        if (pgTerm.level2) {
                            angular.forEach(pgTerm.level2, function (levelTwoTerm) {
                                if (levelTwoTerm.termName === clientName) {
                                    levelOneList.push(pgTerm);
                                }
                            });
                        }
                    });
                    vm.levelOneList = levelOneList;
                    var data = {};
                    data.name = vm.parentLevelOneList.name;
                    data.levels = vm.parentLevelOneList.levels;
                    data.level1 = levelOneList;
                    vm.selectedLevelOneItem = vm.levelOneList[0];
                    getTaxonomyHierarchy(data);
                }
            }
            //To call web api to get matter extra properties for sepecific term or sub area of law.
            vm.extraMatterFields = [];          
            function getAdditionalMatterProperties(data) {                
                vm.lazyloader = false;
                var additionalMatterPropSettingName = configs.taxonomy.matterProvisionExtraPropertiesContentType;
                if (data[additionalMatterPropSettingName] !== null && data[additionalMatterPropSettingName] !== undefined && data[additionalMatterPropSettingName] != "") {
                    var optionsForGetmatterprovisionextraproperties = {
                        Client: {
                            Url: vm.clienturl
                        },
                        MatterExtraProperties: {
                            ContentTypeName: data[additionalMatterPropSettingName]
                        }
                    }
                    getmatterprovisionextraproperties(optionsForGetmatterprovisionextraproperties, function (result) {
                        console.log(result);
                        $("#divExtraMatterProps").removeClass("ng-hide"); 
                        $("#showDocumentAdditionalProp").removeClass("ng-hide");                        

                        vm.extraMatterFields = result.Fields;
                        angular.forEach(vm.extraMatterFields, function (field) {
                            if (vm.additionalFieldValues !== null && vm.additionalFieldValues !== "") {
                                angular.forEach(vm.additionalFieldValues, function (additionalfield) {
                                    if (additionalfield.FieldName == field.fieldInternalName) {
                                        if (additionalfield.IsDisplayInUI == null || additionalfield.IsDisplayInUI == undefined || additionalfield.IsDisplayInUI == '') {
                                            additionalfield.IsDisplayInUI = 'false';
                                        }
                                        field.displayInUI = additionalfield.IsDisplayInUI;
                                        if (additionalfield.IsMandatory == null || additionalfield.IsMandatory == undefined || additionalfield.IsMandatory == '') {
                                            additionalfield.IsMandatory = 'false';
                                        }
                                        field.required = additionalfield.IsMandatory;
                                    }
                                })
                            }
                        });
                        vm.lazyloader = true;
                        console.log(vm.extraMatterFields);
                    });
                }
                else {
                    vm.lazyloader = true;
                    $("#divExtraMatterProps").addClass("ng-hide");
                    $("#showDocumentAdditionalProp").addClass("ng-hide");
                    vm.extraMatterFields = [];
                }
            }

            //Populate Field object with display in ui and required properties to display in UI.
            function getExtraMatterFieldValues() {
                var Fields = [];
                angular.forEach(vm.extraMatterFields, function (input) {
                    var field = { FieldName: "", IsDisplayInUI: "", IsMandatory: "" }
                    field.FieldName = input.fieldInternalName;
                    field.IsDisplayInUI = input.displayInUI;
                    field.IsMandatory = false;
                    if (input.displayInUI) {
                        field.IsMandatory = input.required;
                    }
                    if (-1 == Fields.indexOf(field)) {
                        Fields.push(field);
                    }
                });
                return Fields;
            }
            vm.isLoginUserOwner();

            vm.pageLoadCompleted = function () {
                jQuery.a11yfy.assertiveAnnounce("Settings page loaded successfully");
            }
        }]);
    app.filter('getAssociatedDocumentTemplatesCount', function () {
        return function (input, splitChar) {
            return input.split(splitChar).length;;
        }
    });
})();