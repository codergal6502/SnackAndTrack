using Microsoft.EntityFrameworkCore;
using SnackAndTrack.DatabaseAccess;

namespace SnackAndTrack.WebApp {

    internal class Program
    {
        private static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllersWithViews();

            builder.Services.AddDbContext<SnackAndTrackDbContext>(options => 
                options.UseNpgsql(builder.Configuration.GetConnectionString("PSQLConnection"))
            );

            builder.Services.AddHostedService<SnackAndTrackDbContextInitalizationService>();

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

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller}/{action=Index}/{id?}");

            // if (app.Environment.IsDevelopment()) {
                app.MapGet("/debug/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
                    string.Join("\n", endpointSources.SelectMany(source => source.Endpoints)));
            // }

            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}