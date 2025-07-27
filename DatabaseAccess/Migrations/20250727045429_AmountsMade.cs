using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DatabaseAccess.Migrations
{
    /// <inheritdoc />
    public partial class AmountsMade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecipeIngredients_FoodItems_FoodItemId",
                table: "RecipeIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_RecipeIngredients_Units_UnitId",
                table: "RecipeIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_ServingSizes_Units_UnitId",
                table: "ServingSizes");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitConversions_Units_FromUnitId",
                table: "UnitConversions");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitConversions_Units_ToUnitId",
                table: "UnitConversions");

            migrationBuilder.AlterColumn<Guid>(
                name: "ToUnitId",
                table: "UnitConversions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "FromUnitId",
                table: "UnitConversions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "ServingSizes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "RecipeIngredients",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "FoodItemId",
                table: "RecipeIngredients",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "AmountMade",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<float>(type: "real", nullable: false),
                    DisplayOrder = table.Column<short>(type: "smallint", nullable: false),
                    RecipeId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmountMade", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AmountMade_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AmountMade_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AmountMade_RecipeId",
                table: "AmountMade",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_AmountMade_UnitId",
                table: "AmountMade",
                column: "UnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecipeIngredients_FoodItems_FoodItemId",
                table: "RecipeIngredients",
                column: "FoodItemId",
                principalTable: "FoodItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RecipeIngredients_Units_UnitId",
                table: "RecipeIngredients",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ServingSizes_Units_UnitId",
                table: "ServingSizes",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UnitConversions_Units_FromUnitId",
                table: "UnitConversions",
                column: "FromUnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UnitConversions_Units_ToUnitId",
                table: "UnitConversions",
                column: "ToUnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecipeIngredients_FoodItems_FoodItemId",
                table: "RecipeIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_RecipeIngredients_Units_UnitId",
                table: "RecipeIngredients");

            migrationBuilder.DropForeignKey(
                name: "FK_ServingSizes_Units_UnitId",
                table: "ServingSizes");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitConversions_Units_FromUnitId",
                table: "UnitConversions");

            migrationBuilder.DropForeignKey(
                name: "FK_UnitConversions_Units_ToUnitId",
                table: "UnitConversions");

            migrationBuilder.DropTable(
                name: "AmountMade");

            migrationBuilder.AlterColumn<Guid>(
                name: "ToUnitId",
                table: "UnitConversions",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "FromUnitId",
                table: "UnitConversions",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "ServingSizes",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnitId",
                table: "RecipeIngredients",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "FoodItemId",
                table: "RecipeIngredients",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_RecipeIngredients_FoodItems_FoodItemId",
                table: "RecipeIngredients",
                column: "FoodItemId",
                principalTable: "FoodItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RecipeIngredients_Units_UnitId",
                table: "RecipeIngredients",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ServingSizes_Units_UnitId",
                table: "ServingSizes",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UnitConversions_Units_FromUnitId",
                table: "UnitConversions",
                column: "FromUnitId",
                principalTable: "Units",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UnitConversions_Units_ToUnitId",
                table: "UnitConversions",
                column: "ToUnitId",
                principalTable: "Units",
                principalColumn: "Id");
        }
    }
}
