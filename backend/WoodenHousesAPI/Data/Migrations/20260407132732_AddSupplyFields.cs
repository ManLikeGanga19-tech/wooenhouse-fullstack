using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CountryOfSupply",
                table: "Quotes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlaceOfSupply",
                table: "Quotes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryOfSupply",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "PlaceOfSupply",
                table: "Quotes");
        }
    }
}
