using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuotePublicToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicToken",
                table: "Quotes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_PublicToken",
                table: "Quotes",
                column: "PublicToken",
                unique: true,
                filter: "\"PublicToken\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quotes_PublicToken",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "PublicToken",
                table: "Quotes");
        }
    }
}
