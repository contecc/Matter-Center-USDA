﻿// ***********************************************************************
// Assembly         : Microsoft.Legal.MatterCenter.Utility
// Author           : aislid
// Created          : 07-06-2016
//
// ***********************************************************************
// <copyright file="IMatterRepository.cs" company="Microsoft">
//     Copyright (c) . All rights reserved.
// </copyright>
// This interface contains all UI Configuration functionalities
// ***********************************************************************

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.WindowsAzure.Storage.Table;


namespace Microsoft.Legal.MatterCenter.Repository
{
    public interface IConfigRepository
    {
        Task<List<DynamicTableEntity>> GetConfigurationsAsync(String filter);
        Task<bool> InsertUpdateConfigurationsAsync(String configs);
        List<DynamicTableEntity> GetConfigEntities(string filter);
        bool UpdateEntityProperty(string configs);
        void UploadConfigFileToSPO(string filePath, string clientUrl);
    }
}
