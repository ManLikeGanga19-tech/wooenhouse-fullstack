using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailLogHtmlBody : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HtmlBody",
                table: "EmailLogs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HtmlBody",
                table: "EmailLogs");
        }
    }
}
