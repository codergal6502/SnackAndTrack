using SnackAndTrack.DatabaseAccess;
using SnackAndTrack.DatabaseAccess.Seeding;

namespace SnackAndTrack.WebApp {
    public class SnackAndTrackDbContextInitalizationService : IHostedService
    {
        // See https://www.honlsoft.com/blog/2021-02-06-running-startup-logic-in-asp-net-core/
        // See https://learn.microsoft.com/en-us/answers/questions/1530333/cannot-consume-scoped-from-singlleton-service
        private readonly IServiceScopeFactory _scopeFactory;

        public SnackAndTrackDbContextInitalizationService(IServiceScopeFactory dbContextFactory) {
            this._scopeFactory = dbContextFactory;
        }
        
        public Task StartAsync(CancellationToken cancellationToken) {
            using (var scope = _scopeFactory.CreateScope()) {
                using (var ctx = scope.ServiceProvider.GetService<SnackAndTrackDbContext>()) {
                    if (null != ctx) {
                        UnitSeed unitSeed = new(ctx);
                        unitSeed.DoSeed();

                        NutrientSeed nutrientSeed = new(ctx);
                        nutrientSeed.DoSeed();
                    }
                }
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}