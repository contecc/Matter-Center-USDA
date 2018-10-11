﻿using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Builder;
using System.IO;

using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Table;
namespace Microsoft.Legal.MatterCenter.Jobs
{
    public class Program
    {     
        public static void Main(string[] args)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appSettings.json")
                .AddInMemoryCollection()
                .AddEnvironmentVariables();//appsettings.json will be overridden with azure web appsettings

            var configuration = builder.Build();
            KeyVaultHelper kv = new KeyVaultHelper(configuration);
            KeyVaultHelper.GetCert(configuration);
            kv.GetKeyVaultSecretsCerticate();
            var azureStorageConnectionString = configuration["General:CloudStorageConnectionString"];
            JobHostConfiguration config = new JobHostConfiguration(azureStorageConnectionString);
            config.UseTimers();
            
            var host = new JobHost(config);            
            host.RunAndBlock();
        }
    }
}
