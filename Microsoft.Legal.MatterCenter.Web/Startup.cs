﻿using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json;
using System.Net;
using Microsoft.AspNetCore.Http;



#region Matter Namespaces
using Microsoft.Legal.MatterCenter.Utility;
using Microsoft.Legal.MatterCenter.Repository;
using Microsoft.Legal.MatterCenter.Service.Filters;
using System.Globalization;
using Microsoft.Legal.MatterCenter.Web.Common;

using System.IO;
using System.Text;
using System.Collections.Generic;
using Swashbuckle.AspNetCore.Swagger;
#endregion


namespace Microsoft.Legal.MatterCenter.Web
{
    public class Startup
    {
        #region Properties
        public IHostingEnvironment HostingEnvironment { get; }
        public ILoggerFactory LoggerFactory { get; }
        public IConfigurationRoot Configuration { get; set; }
        
        #endregion    
        
        public Startup(IHostingEnvironment env,  ILoggerFactory logger)
        {
            this.HostingEnvironment = env;
            this.LoggerFactory = logger;

            var builder = new ConfigurationBuilder()
                .SetBasePath(HostingEnvironment.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();
            if (HostingEnvironment.IsDevelopment())
            {
                // This will push telemetry data through Application Insights pipeline faster, allowing you to view results immediately.
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
           
        }

        /// <summary>
        ///  This method gets called by the runtime. Use this method to add services to the container.
        /// </summary>
        /// <param name="services"></param>
        public void ConfigureServices(IServiceCollection services)
        {
            KeyVaultHelper keyVaultHelper = new KeyVaultHelper(Configuration);
            KeyVaultHelper.GetCert(Configuration);
            keyVaultHelper.GetKeyVaultSecretsCerticate();
            
            services.AddSingleton(Configuration);
            
            ConfigureSettings(services);

        
            services.AddCors();
            services.AddLogging();
            
            ConfigureMvc(services, LoggerFactory);
            // Add framework services.
            services.AddApplicationInsightsTelemetry(Configuration);
            services.AddMvcCore();
            ConfigureMatterPackages(services);
            ConfigureSwagger(services); 
        }


        /// <summary>
        /// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        /// </summary>
        /// <param name="app"></param>
        /// <param name="env"></param>
        /// <param name="loggerFactory"></param>
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory
        //    ,IOptionsMonitor<GeneralSettings> generalSettings,
        //    IOptionsMonitor<TaxonomySettings> taxonomySettings,
        //    IOptionsMonitor<MatterSettings> matterSettings,
        //    IOptionsMonitor<DocumentSettings> documentSettings,
        //    IOptionsMonitor<SharedSettings> sharedSettings,
        //    IOptionsMonitor<MailSettings> mailSettings,
        //    IOptionsMonitor<ListNames> listNames,
        //    IOptionsMonitor<LogTables> logTables,
        //    IOptionsMonitor<SearchSettings> searchSettings,
        //    IOptionsMonitor<CamlQueries> camlQueries,
        //    IOptionsMonitor<ContentTypesConfig> contentTypesConfig,
        //    IOptionsMonitor<MatterCenterApplicationInsights> matterCenterApplicationInsights
        )
        {
            CreateConfig(env);
           

            var log = loggerFactory.CreateLogger<Startup>();
            try
            {
                loggerFactory.AddConsole(Configuration.GetSection("Logging"));
                loggerFactory.AddDebug();


                //generalSettings.OnChange(genSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<GeneralSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", genSettings)}");

                //});
                //taxonomySettings.OnChange(taxSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<TaxonomySettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", taxSettings)}");
                //});
                //matterSettings.OnChange(matSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<MatterSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", matSettings)}");
                //});
                //documentSettings.OnChange(docSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<DocumentSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", docSettings)}");
                //});
                //sharedSettings.OnChange(shrdSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<SharedSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", shrdSettings)}");
                //});
                //mailSettings.OnChange(mlSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<MailSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", mlSettings)}");
                //});
                //listNames.OnChange(lstNames => {
                //    loggerFactory
                //        .CreateLogger<IOptions<ListNames>>()
                //        .LogDebug($"Config changed: {string.Join(", ", lstNames)}");
                //});
                //logTables.OnChange(logSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<LogTables>>()
                //        .LogDebug($"Config changed: {string.Join(", ", logSettings)}");
                //});
                //searchSettings.OnChange(srchSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<SearchSettings>>()
                //        .LogDebug($"Config changed: {string.Join(", ", srchSettings)}");
                //});
                //camlQueries.OnChange(camlSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<CamlQueries>>()
                //        .LogDebug($"Config changed: {string.Join(", ", camlSettings)}");
                //});
                //contentTypesConfig.OnChange(ctpSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<ContentTypesConfig>>()
                //        .LogDebug($"Config changed: {string.Join(", ", ctpSettings)}");
                //});


                //matterCenterApplicationInsights.OnChange(appInsightSettings => {
                //    loggerFactory
                //        .CreateLogger<IOptions<MatterCenterApplicationInsights>>()
                //        .LogDebug($"Config changed: {string.Join(", ", appInsightSettings)}");
                //});
                app.UseApplicationInsightsRequestTelemetry();
                if (env.IsDevelopment())
                {
                    app.UseBrowserLink();
                    app.UseDeveloperExceptionPage();
                }
                else
                {
                    app.UseExceptionHandler("/Home/Error");
                }              

                app.UseApplicationInsightsExceptionTelemetry();
                app.UseDefaultFiles();
                app.UseStaticFiles();
                CheckAuthorization(app);
                app.UseCors(builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
                app.UseMvc();
                app.UseSwagger();
                app.UseSwaggerUI(c => {
                    //c.ConfigureOAuth2("55620714-62b4-49fb-9c3a-70976b11fd53", "0GrGhdAbSf2IVnE3t/bxGM1wLd3rcV/1uL2YiIZpYyo=",
                    //    "https://localhost:44324/swagger/ui/o2c-html",
                    //    "swagger-ui",
                    //    "", new Dictionary<string, string> { { "resource", "b94f07df-c825-431f-b9c5-b9499e8e9ac1" } });

                    c.EnabledValidator();
                    c.BooleanValues(new object[] { 0, 1 });
                    c.DocExpansion("full");
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Matter Web App API");
                    //c.InjectOnCompleteJavaScript("/swagger-ui/on-complete.js");
                    //c.InjectOnFailureJavaScript("/swagger-ui/on-failure.js");
                    c.SupportedSubmitMethods(new[] { "get", "post", "put", "patch" });
                    c.ShowRequestHeaders();
                    c.ShowJsonEditor();

                });
            }
            catch (Exception ex)
            {
                app.Run(
                        async context => {
                            log.LogError($"{ex.Message}");
                            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                            context.Response.ContentType = "text/plain";
                            await context.Response.WriteAsync(ex.Message).ConfigureAwait(false);
                            await context.Response.WriteAsync(ex.StackTrace).ConfigureAwait(false);
                        });

            } 
        }

        // Entry point for the application.       

        #region Private Methods

        #region Swagger
        private void ConfigureSwagger(IServiceCollection services)
        {
            string pathToDoc = $"{System.AppDomain.CurrentDomain.BaseDirectory}Microsoft.Legal.MatterCenter.Web.xml";
            services.AddSwaggerGen(c =>
            {
                // Define the OAuth2.0 scheme that's in use (i.e. Implicit Flow)
                Dictionary<string, string> scopes = new Dictionary<string, string>();
                scopes.Add("user_impersonation", "Access https://matterwebapp.azurewebsites.net");
                //c.AddSecurityDefinition("matterCenterAuthorization", new OAuth2Scheme
                //{
                //    Type = "oauth2",
                //    AuthorizationUrl = "https://login.windows.net/3c4562ca-39a4-4d8b-91ff-6d3eefab5c1d/oauth2/authorize",
                //    Flow = "implicit",
                //    Scopes = scopes
                //});
                //c.OperationFilter<SecurityRequirementsOperationFilter>();
                c.IncludeXmlComments(pathToDoc);
                c.DescribeAllEnumsAsStrings();
                c.DescribeStringEnumsInCamelCase();
                c.CustomSchemaIds((type) => type.FullName);
                c.TagActionsBy(api => api.HttpMethod);
                c.IgnoreObsoleteActions();
                c.SwaggerDoc("v1",
                    new Info
                    {
                        Title = "Matter Center API - V1",
                        Version = "v1",
                        Description = "Matter Center API - V1",
                        TermsOfService = "Matter Center Terms",
                        Contact = new Contact
                        {
                            Name = "Matter Center",
                            Email = "matteradmin@msmatter.onmicrosoft.com"
                        },
                        License = new License
                        {
                            Name = "Apache 2.0",
                            Url = "http://www.apache.org/licenses/LICENSE-2.0.html"
                        }
                    }
                );
            });
        }


        #endregion

        private void ConfigureMvc(IServiceCollection services, ILoggerFactory logger)
        {
            var builder = services.AddMvc().AddDataAnnotationsLocalization();
            builder.AddJsonOptions(o => {
                o.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                o.SerializerSettings.Converters.Add(new StringEnumConverter());
                o.SerializerSettings.Formatting = Formatting.Indented;
            });
            var instrumentationKey = this.Configuration.GetSection("ApplicationInsights").GetSection("InstrumentationKey").Value.ToString();
            builder.AddMvcOptions(o => { o.Filters.Add(new MatterCenterExceptionFilter(logger, instrumentationKey)); });
        }
         

        private void ConfigureSettings(IServiceCollection services)
        {
            services.Configure<GeneralSettings>(this.Configuration.GetSection("General"));
            services.Configure<UIConfigSettings>(this.Configuration.GetSection("UIConfig"));
            services.Configure<TaxonomySettings>(this.Configuration.GetSection("Taxonomy"));
            services.Configure<MatterSettings>(this.Configuration.GetSection("Matter"));
            services.Configure<DocumentSettings>(this.Configuration.GetSection("Document"));
            services.Configure<SharedSettings>(this.Configuration.GetSection("Shared"));
            services.Configure<MailSettings>(this.Configuration.GetSection("Mail"));
            services.Configure<ErrorSettings>(this.Configuration.GetSection("ErrorMessages"));
            services.Configure<ListNames>(this.Configuration.GetSection("ListNames"));
            services.Configure<LogTables>(this.Configuration.GetSection("LogTables"));
            services.Configure<SearchSettings>(this.Configuration.GetSection("Search"));
            services.Configure<CamlQueries>(this.Configuration.GetSection("CamlQueries"));
            services.Configure<ContentTypesConfig>(this.Configuration.GetSection("ContentTypes"));
            services.Configure<MatterCenterApplicationInsights>(this.Configuration.GetSection("ApplicationInsights"));     
        }

        private void ConfigureMatterPackages(IServiceCollection services)
        {
            services.AddSingleton<ISPOAuthorization, SPOAuthorization>();
            services.AddSingleton<ITaxonomyRepository, TaxonomyRepository>();
            services.AddScoped<IMatterCenterServiceFunctions, MatterCenterServiceFunctions>();
            services.AddSingleton<ITaxonomy, Taxonomy>();
            services.AddSingleton<ISite, Site>();
            services.AddSingleton<IMatterRepository, MatterRepository>();
            services.AddSingleton<IUsersDetails, UsersDetails>();
            services.AddSingleton<ICustomLogger, CustomLogger>();
            services.AddSingleton<IDocumentRepository, DocumentRepository>();
            services.AddSingleton<ISearch, Search>();
            services.AddSingleton<ISPList, SPList>();
            services.AddSingleton<ISPPage, SPPage>();
            services.AddSingleton<ISharedRepository, SharedRepository>();
            services.AddSingleton<IValidationFunctions, ValidationFunctions>();
            services.AddSingleton<IEditFunctions, EditFunctions>();
            services.AddSingleton<IMatterProvision, MatterProvision>();
            services.AddSingleton<ISPContentTypes, SPContentTypes>();
            services.AddSingleton<IUploadHelperFunctions, UploadHelperFunctions>();
            services.AddSingleton<IUploadHelperFunctionsUtility, UploadHelperFunctionsUtility>();
            services.AddSingleton<IDocumentProvision, DocumentProvision>();
            services.AddSingleton<IUserRepository, UserRepository>();
            services.AddSingleton<IExternalSharing, ExternalSharing>();
            services.AddSingleton<IConfigRepository, ConfigRepository>();
            services.AddSingleton<IExternalSharing, ExternalSharing>();
            services.AddSingleton<IMailMessageRepository, MailMessageRepository>();
            services.AddSingleton<IEmailProvision, EmailProvision>();
            services.AddTransient<IHttpContextAccessor, HttpContextAccessor>();
        }

        /// <summary>
        /// check the current request and check whether the request is having the bearer token. If bearer token
        /// is present it will validate the same and if it is not present, the api will throw 401 unauthorized error
        /// </summary>
        /// <param name="app"></param>
        private void CheckAuthorization(IApplicationBuilder app)
        {
            try
            {
                app.UseJwtBearerAuthentication(new JwtBearerOptions()
                {
                    //AutomaticAuthenticate flag tells the middleware to look for the Bearer token in the headers of incoming requests and, 
                    //if one is found, validate it. If validation is successful the middleware will populate the current ClaimsPrincipal 
                    //associated with the request with claims (and potentially roles) obtained from the token. 
                    //It will also mark the current identity as authenticated.
                    AutomaticAuthenticate = true,

                    //AutomaticChallenge flag tells the middleware to modify 401 responses that are coming from further middleware 
                    //(MVC) and add appropriate challenge behavior. In case of Bearer authentication it's about adding the following header to the response:
                    //HTTP / 1.1 401 Unauthorized
                    //WWW - Authenticate: Bearer
                    AutomaticChallenge = true,
                
                    Authority = String.Format(CultureInfo.InvariantCulture,
                        this.Configuration.GetSection("General").GetSection("AADInstance").Value.ToString(),
                        this.Configuration.GetSection("General").GetSection("Tenant").Value.ToString()),
                    Audience = this.Configuration.GetSection("General").GetSection("ClientId").Value.ToString(),
                    Events = new AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                    {
                        OnTokenValidated = ctx =>
                        {
                            //If any claims need to read that returned by the active directory, we can read those claims here. The below code will read name 
                            //claim from the aad token
                            //var nameClaim = ctx.Ticket.Principal.FindFirst("name");
                            //if (nameClaim != null)
                            //{
                            //    var claimsIdentity = (ClaimsIdentity)ctx.Ticket.Principal.Identity;
                            //    claimsIdentity.AddClaim(new Claim(ClaimTypes.Name, nameClaim.Value));
                            //}
                          
                            return Task.FromResult(0);
                        },
                        OnAuthenticationFailed = context =>
                        {
                            //If the token is not valid, the request pipe line will be short circuited and the error response will be
                            //sent to the client
                            context.SkipToNextMiddleware();
                            return Task.FromResult(0);
                        },                        
                    }
                });
            }
            catch(Exception ex)
            {

            }
        }



        private void CreateConfig(IHostingEnvironment hostingEnvironment)
        { 
            StringBuilder sb = new StringBuilder();
            JsonWriter jw = new JsonTextWriter(new StringWriter(sb));
            jw.Formatting = Formatting.Indented;

            var configPath = Path.Combine(hostingEnvironment.WebRootPath, "app/config.js");
            if (System.IO.File.Exists(configPath))
                System.IO.File.Delete(configPath);

            var configFile = File.Open(configPath, FileMode.Create);
            var configWriter = new StreamWriter(configFile, Encoding.UTF8);

            var generalSettingsSection = Configuration.GetSection("General");
            var matterSettingsSection = Configuration.GetSection("Matter").GetChildren();
            var uploadMessagesSection = Configuration.GetSection("uploadMessages").GetChildren();
            var taxonomySettingsSection = Configuration.GetSection("Taxonomy");
            var searchSettingsSection = Configuration.GetSection("Search").GetChildren();
            var contentTypeSettingsSection = Configuration.GetSection("ContentTypes").GetSection("ManagedColumns").GetChildren();
            var contentTypeStampedSettingsSection = Configuration.GetSection("ContentTypes").GetSection("ManagedStampedColumns").GetChildren();
            var appInsightsSections = Configuration.GetSection("ApplicationInsights");
            var matterSearchColumnPickerSection = Configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter").GetChildren();
            var documentSearchColumnPickerSection = Configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument").GetChildren();

            configWriter.WriteLine("var configs =");
            jw.WriteStartObject();

            jw.WritePropertyName("uri");
                jw.WriteStartObject();
                    jw.WritePropertyName("SPOsiteURL");
                    jw.WriteValue(generalSettingsSection["SiteURL"]);
                    jw.WritePropertyName("tenant");
                    jw.WriteValue(generalSettingsSection["Tenant"]);
                    jw.WritePropertyName("MainURL");
                    jw.WriteValue(generalSettingsSection["MainURL"]);
                jw.WriteEndObject();


            jw.WritePropertyName("ADAL");
                jw.WriteStartObject();
                    jw.WritePropertyName("clientId");
                    jw.WriteValue(generalSettingsSection["ClientId"]);
                    jw.WritePropertyName("authUserEmail");
                    jw.WriteValue("");
                jw.WriteEndObject();

            jw.WritePropertyName("appInsights");
                jw.WriteStartObject();
                    jw.WritePropertyName("instrumentationKey");
                    jw.WriteValue(appInsightsSections["InstrumentationKey"]);  
                    jw.WritePropertyName("appType");
                    jw.WriteValue("");                      
                jw.WriteEndObject();

            jw.WritePropertyName("global");
                jw.WriteStartObject();
                    jw.WritePropertyName("repositoryUrl");
                    jw.WriteValue(generalSettingsSection["CentralRepositoryUrl"]);
                    jw.WritePropertyName("isDevMode");
                    jw.WriteValue(bool.Parse(generalSettingsSection["IsDevMode"]));
                    jw.WritePropertyName("isBackwardCompatible");
                    jw.WriteValue(bool.Parse(generalSettingsSection["IsBackwardCompatible"]));
                    jw.WritePropertyName("isClientMappedWithHierachy");
                    jw.WriteValue(bool.Parse(generalSettingsSection["IsClientMappedWithHierachy"]));
                    jw.WritePropertyName("overwriteDupliacteFileNameWithDateTimeFor");
                    jw.WriteValue(generalSettingsSection["OverwriteDupliacteFileNameWithDateTimeFor"]);
                jw.WriteEndObject();

            jw.WritePropertyName("matter");
                jw.WriteStartObject();
                    foreach (var key in matterSettingsSection)
                    {
                        //Assuming that all the keys for the matter property bag keys will start with "StampedProperty"
                        if (key.Key.ToString().ToLower().StartsWith("stampedproperty"))
                        {
                            jw.WritePropertyName(key.Key);
                            jw.WriteValue(key.Value);
                        }
                        //Assuming that all the keys for the matter property bag keys will start with "StampedProperty"
                        if (key.Key.ToString().ToLower().StartsWith("specialcharacterexpression"))
                        {
                            jw.WritePropertyName(key.Key);
                            jw.WriteValue(key.Value);
                        }
                    }
                jw.WriteEndObject();

            jw.WritePropertyName("taxonomy");
                jw.WriteStartObject();
                    jw.WritePropertyName("levels");
                    jw.WriteValue(taxonomySettingsSection["Levels"]);
                    jw.WritePropertyName("practiceGroupTermSetName");
                    jw.WriteValue(taxonomySettingsSection["PracticeGroupTermSetName"]);
                    jw.WritePropertyName("termGroup");
                    jw.WriteValue(taxonomySettingsSection["TermGroup"]);
                    jw.WritePropertyName("clientTermSetName");
                    jw.WriteValue(taxonomySettingsSection["ClientTermSetName"]);
                    jw.WritePropertyName("clientCustomPropertiesURL");
                    jw.WriteValue(taxonomySettingsSection["ClientCustomPropertiesURL"]);
                    jw.WritePropertyName("clientCustomPropertiesId");
                    jw.WriteValue(taxonomySettingsSection["ClientCustomPropertiesId"]);

                    jw.WritePropertyName("subAreaOfLawCustomContentTypeProperty");
                    jw.WriteValue(taxonomySettingsSection["SubAreaOfLawContentTypeTemplates"]);
                    jw.WritePropertyName("subAreaOfLawDocumentContentTypeProperty");
                    jw.WriteValue(taxonomySettingsSection["SubAreaOfLawDocumentTemplates"]);

                    jw.WritePropertyName("matterProvisionExtraPropertiesContentType");
                    jw.WriteValue(taxonomySettingsSection["MatterProvisionExtraPropertiesContentType"]);

                jw.WriteEndObject();

            jw.WritePropertyName("search");
                jw.WriteStartObject();
                    jw.WritePropertyName("Schema");
                    jw.WriteValue(Configuration.GetSection("Search").GetSection("Schema").Value);
                    foreach (var key in searchSettingsSection)
                    {
                        //Assuming that all the keys for the matter property bag keys will start with "StampedProperty"
                        if (key.Key.ToString().ToLower().StartsWith("managedproperty"))
                        {
                            jw.WritePropertyName(key.Key);
                            jw.WriteValue(key.Value);
                        }
                    }             

                
                    jw.WritePropertyName("searchColumnsUIPickerForMatter");
                        jw.WriteStartObject();
                            foreach (var key in matterSearchColumnPickerSection)
                            {                        
                                jw.WritePropertyName(key.Key);
                                    jw.WriteStartObject();
                                        foreach (var subKey in Configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForMatter").GetSection(key.Key).GetChildren())
                                        {
                                                jw.WritePropertyName(subKey.Key);
                                                var propVal = subKey.Value.Trim();
                                                var propKey = subKey.Key.Trim();

                                                switch (propKey)
                                                {
                                                    case "displayInUI":
                                                    case "defaultVisibleInGrid":
                                                    case "displayInFlyOut":
                                                    case "enableHiding":
                                                    case "enableColumnMenu":
                                                    case "displayInDashboard":
                                                        jw.WriteValue(bool.Parse(propVal));
                                                        break;
                                                    case "position":
                                                        jw.WriteValue(int.Parse(propVal));
                                                        break;
                                                    default:
                                                        jw.WriteValue(propVal);
                                                        break;
                                                }
                                        }
                                    jw.WriteEndObject();
                            }
                        jw.WriteEndObject();


                    jw.WritePropertyName("searchColumnsUIPickerForDocument");
                        jw.WriteStartObject();
                            foreach (var key in documentSearchColumnPickerSection)
                            {
                                jw.WritePropertyName(key.Key);
                                    jw.WriteStartObject();
                                    foreach (var subKey in Configuration.GetSection("Search").GetSection("SearchColumnsUIPickerForDocument").GetSection(key.Key).GetChildren())
                                    {
                                        jw.WritePropertyName(subKey.Key);
                                        var propVal = subKey.Value.Trim();
                                        var propKey = subKey.Key.Trim();

                                        switch (propKey)
                                        {
                                            case "displayInUI":
                                            case "defaultVisibleInGrid":
                                            case "displayInFlyOut":
                                            case "enableHiding":
                                            case "enableColumnMenu":
                                            case "displayInDashboard":
                                            case "suppressRemoveSort":
                                                jw.WriteValue(bool.Parse(propVal));
                                                break;
                                            case "position":
                                                jw.WriteValue(int.Parse(propVal));
                                                break;
                                            default:
                                                jw.WriteValue(propVal);
                                                break;
                                        }
                                    }
                                jw.WriteEndObject();
                            }
                        jw.WriteEndObject();
                    jw.WriteEndObject();

            jw.WritePropertyName("contentTypes");
                jw.WriteStartObject();
                    jw.WritePropertyName("managedColumns");
                        jw.WriteStartObject();
                        foreach (var key in contentTypeSettingsSection)
                        {                            
                            jw.WritePropertyName(key.Key);
                            jw.WriteValue(key.Value);                            
                        }
                        jw.WriteEndObject();
                
                    jw.WritePropertyName("managedStampedColumns");
                        jw.WriteStartObject();
                        foreach (var key in contentTypeStampedSettingsSection)
                        {
                            jw.WritePropertyName(key.Key);
                            jw.WriteValue(key.Value);
                        }
                     jw.WriteEndObject();
            jw.WriteEndObject();            

            
            jw.WriteEndObject();
            configWriter.Write(sb.ToString());            
            configWriter.Dispose();

        }

        #endregion
    }
}
