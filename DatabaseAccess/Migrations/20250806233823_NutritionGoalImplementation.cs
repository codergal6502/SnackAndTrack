using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DatabaseAccess.Migrations
{
    /// <inheritdoc />
    public partial class NutritionGoalImplementation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NutritionGoalSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Period = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionGoalSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NutritionGoalSetDayModes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "VARCHAR(16)", nullable: false),
                    DayNumber = table.Column<short>(type: "smallint", nullable: false),
                    NutritionGoalSetId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionGoalSetDayModes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NutritionGoalSetDayModes_NutritionGoalSets_NutritionGoalSet~",
                        column: x => x.NutritionGoalSetId,
                        principalTable: "NutritionGoalSets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NutritionGoalSetNutrients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NutrientId = table.Column<Guid>(type: "uuid", nullable: false),
                    NutritionGoalSetId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionGoalSetNutrients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NutritionGoalSetNutrients_Nutrients_NutrientId",
                        column: x => x.NutrientId,
                        principalTable: "Nutrients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NutritionGoalSetNutrients_NutritionGoalSets_NutritionGoalSe~",
                        column: x => x.NutritionGoalSetId,
                        principalTable: "NutritionGoalSets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NutritionGoalSetNutrientTargets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Minimum = table.Column<short>(type: "smallint", nullable: true),
                    Maximum = table.Column<short>(type: "smallint", nullable: true),
                    Start = table.Column<short>(type: "smallint", nullable: false),
                    End = table.Column<short>(type: "smallint", nullable: false),
                    NutritionGoalSetNutrientId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionGoalSetNutrientTargets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NutritionGoalSetNutrientTargets_NutritionGoalSetNutrients_N~",
                        column: x => x.NutritionGoalSetNutrientId,
                        principalTable: "NutritionGoalSetNutrients",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_NutritionGoalSetDayModes_NutritionGoalSetId",
                table: "NutritionGoalSetDayModes",
                column: "NutritionGoalSetId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionGoalSetNutrients_NutrientId",
                table: "NutritionGoalSetNutrients",
                column: "NutrientId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionGoalSetNutrients_NutritionGoalSetId",
                table: "NutritionGoalSetNutrients",
                column: "NutritionGoalSetId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionGoalSetNutrientTargets_NutritionGoalSetNutrientId",
                table: "NutritionGoalSetNutrientTargets",
                column: "NutritionGoalSetNutrientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NutritionGoalSetDayModes");

            migrationBuilder.DropTable(
                name: "NutritionGoalSetNutrientTargets");

            migrationBuilder.DropTable(
                name: "NutritionGoalSetNutrients");

            migrationBuilder.DropTable(
                name: "NutritionGoalSets");
        }
    }
}
