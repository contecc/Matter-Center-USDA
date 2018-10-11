﻿using Xunit;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Legal.MatterCenter.Models;
using System.Net.Http;

using System.Collections.Generic;
using Microsoft.AspNetCore.Hosting;

namespace Microsoft.Legal.MatterCenter.ServiceTest
{
    public class UserUnitTest
    {
        private readonly TestServer testServer;
        private const string authority = "https://login.windows.net/microsoft.onmicrosoft.com";

        public UserUnitTest()
        {
            testServer = new TestServer(new WebHostBuilder().UseStartup<Startup>());
        }

        /// <summary>
        /// This unit test will try to get all the roles configured in matter center
        /// </summary>
        [Fact]
        public async void Get_Roles()
        {
            var matterClient = new Client()
            {
                Url = "https://msmatter.sharepoint.com/sites/catalog"
            };
            using (var client = testServer.CreateClient().AcceptJson())
            {
                var response = await client.PostAsJsonAsync("http://localhost:44323/api/v1/user/getroles", matterClient);
                var result = response.Content.ReadAsJsonAsync<IList<Role>>().Result;
                Assert.NotNull(result);
            }
        }

        /// <summary>
        /// This unit test will try to get all the roles configured in matter center
        /// </summary>
        [Fact]
        public async void Get_UserProfile_Picture()
        {
            var matterClient = new Client()
            {
                Url = "https://msmatter.sharepoint.com"
            };
            using (var client = testServer.CreateClient().AcceptJson())
            {
                var response = await client.PostAsJsonAsync("http://localhost:44323/api/v1/user/getuserprofilepicture", matterClient);
                var result = response.Content.ReadAsJsonAsync<GenericResponseVM>().Result;
                Assert.NotNull(result);
            }
        }


        /// <summary>
        /// This unit test will try to get all the users who can see a particular item
        /// </summary>
        [Fact]
        public async void Get_Users()
        {
            SearchRequestVM searchRequestVM = new SearchRequestVM()
            {
                Client = new Client()
                {
                    Url = "https://msmatter.sharepoint.com/sites/catalog"
                },
                SearchObject = new SearchObject()
                {
                    SearchTerm = "Matter"
                }
            };
            using (var client = testServer.CreateClient().AcceptJson())
            {
                var response = await client.PostAsJsonAsync("http://localhost:44323/api/v1/user/getusers", searchRequestVM);
                var result = response.Content.ReadAsJsonAsync<IList<Users>>().Result;
                Assert.NotNull(result);
            }
        }

        /// <summary>
        /// This unit test will try to test all the permissions levels that are configured
        /// </summary>
        [Fact]
        public async void Get_Permission_Levels()
        {
            var matterClient = new Client()
            {
                Url = "https://msmatter.sharepoint.com/sites/catalog"
            };
            using (var client = testServer.CreateClient().AcceptJson())
            {
                var response = await client.PostAsJsonAsync("http://localhost:44323/api/v1/user/getpermissionlevels", matterClient);
                var result = response.Content.ReadAsJsonAsync<IList<Role>>().Result;
                Assert.NotNull(result);
            }
        }
    }
}
