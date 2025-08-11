using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DatabaseAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeBatchDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FoodItems_Recipes_GeneratedFoodItem",
                table: "FoodItems");

            migrationBuilder.DropIndex(
                name: "IX_FoodItems_GeneratedFoodItem",
                table: "FoodItems");

            migrationBuilder.RenameColumn(
                name: "GeneratedFoodItem",
                table: "FoodItems",
                newName: "GeneratedFromId");

            migrationBuilder.AddColumn<DateOnly>(
                name: "RecipeBatchDate",
                table: "FoodItems",
                type: "date",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FoodItems_GeneratedFromId",
                table: "FoodItems",
                column: "GeneratedFromId");

            migrationBuilder.AddForeignKey(
                name: "FK_FoodItems_Recipes_GeneratedFromId",
                table: "FoodItems",
                column: "GeneratedFromId",
                principalTable: "Recipes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FoodItems_Recipes_GeneratedFromId",
                table: "FoodItems");

            migrationBuilder.DropIndex(
                name: "IX_FoodItems_GeneratedFromId",
                table: "FoodItems");

            migrationBuilder.DropColumn(
                name: "RecipeBatchDate",
                table: "FoodItems");

            migrationBuilder.RenameColumn(
                name: "GeneratedFromId",
                table: "FoodItems",
                newName: "GeneratedFoodItem");

            migrationBuilder.CreateIndex(
                name: "IX_FoodItems_GeneratedFoodItem",
                table: "FoodItems",
                column: "GeneratedFoodItem",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodItems_Recipes_GeneratedFoodItem",
                table: "FoodItems",
                column: "GeneratedFoodItem",
                principalTable: "Recipes",
                principalColumn: "Id");
        }
    }
}
