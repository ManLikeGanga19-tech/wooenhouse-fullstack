using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSpamColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSpam",
                table: "NewsletterSubscribers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SpamReason",
                table: "NewsletterSubscribers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSpam",
                table: "Contacts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SpamReason",
                table: "Contacts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSpam",
                table: "NewsletterSubscribers");

            migrationBuilder.DropColumn(
                name: "SpamReason",
                table: "NewsletterSubscribers");

            migrationBuilder.DropColumn(
                name: "IsSpam",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "SpamReason",
                table: "Contacts");
        }
    }
}
