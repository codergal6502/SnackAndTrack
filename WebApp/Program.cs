using System.Text.Json.Serialization;
using GraphQL;
using GraphQL.Server.Ui.GraphiQL;
using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.WebApp.GraphQl;
using SnackAndTrack.WebApp.Utilities;

namespace SnackAndTrack.WebApp {

    internal class Program
    {
        private static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllersWithViews().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new EmptyStringDateOnlyConverter());
                options.JsonSerializerOptions.Converters.Add(new EmptyStringTimeOnlyConverter());
                options.JsonSerializerOptions.Converters.Add(new EmptyStringInt16Converter());
                options.JsonSerializerOptions.Converters.Add(new EmptyStringGuidConverter());
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter<WebApp.Models.NutritionGoalSetModel.DayMode.DayModeEnum>());
            });

            builder.Services.AddDbContext<SnackAndTrackDbContext>(options => 
                options.UseNpgsql(builder.Configuration.GetConnectionString("PSQLConnection"))
            );

            builder.Services.AddHostedService<SnackAndTrackDbContextInitalizationService>();

            builder.Services.AddScoped<AppSchema>();
            builder.Services.AddTransient<AppQuery>();

            builder.Services.AddGraphQL(x => { x.AddSystemTextJson(); });

            var app = builder.Build();
            
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();

            app.UseGraphQL<AppSchema>("/graphql/query");
            var graphiQLOptions = new GraphiQLOptions { GraphQLEndPoint = "/graphql/query" };
            app.UseGraphQLGraphiQL(options: graphiQLOptions, path: "/graphql/browser");

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller}/{action=Index}/{id?}");

            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}