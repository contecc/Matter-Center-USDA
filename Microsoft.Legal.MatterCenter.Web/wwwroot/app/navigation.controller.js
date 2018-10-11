(function () {
    'use strict';

    angular.module("matterMain")
        .controller('navigationController', ['$state', '$stateParams', 'api', '$rootScope',
        function ($state, $stateParams, api, $rootScope) {

            var vm = this;
            $rootScope.pageIndex = "0";
            //To load the Contextual help data
            $rootScope.help();
            if (configs.global.isBackwardCompatible == false) {
                vm.SPOHomePage = configs.uri.SPOsiteURL + '/SitePages/MatterCenterHome.aspx?section=1';
            }
            else {
                vm.SPOHomePage = configs.global.repositoryUrl + '/SitePages/MatterCenterHome.aspx?section=1';
            }
            
            function canCreateMatter(options, callback) {
                api({
                    resource: 'navigationResource',
                    method: 'canCreateMatter',
                    data: options,
                    success: callback
                });
            }

            //#region Global Variables
            vm.welcomeheader = false;
            $rootScope.bodyclass = "";
            $rootScope.displayOverflow = "";
            //#endregion
            vm.emailsubject = "USDA OGC Project Center Feedback and Support request";

            //#region dynamic content
            vm.navigationContent = uiconfigs.Navigation;
            vm.header = uiconfigs.Header;
            vm.learnmore = configs.uri.MainURL;
            //#endregion

            vm.canLoginUserCreateMatter = false;
            vm.canCreateMatter = function () {
                var client = {
                    Url: configs.global.repositoryUrl
                }
                canCreateMatter(client, function (response) {
                    vm.canLoginUserCreateMatter = response.canCreateMatter
                })
            }
            vm.canCreateMatter();

            vm.pageLoadCompleted = function () {
                jQuery.a11yfy.assertiveAnnounce("Home page loaded successfully");
                console.log("Home page loaded successfully");
            }
        }]);
})();
