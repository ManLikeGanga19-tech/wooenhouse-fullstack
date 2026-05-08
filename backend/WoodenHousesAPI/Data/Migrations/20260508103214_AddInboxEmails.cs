using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxEmails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InboxEmails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountEmail = table.Column<string>(type: "text", nullable: false),
                    Folder = table.Column<string>(type: "text", nullable: false),
                    Uid = table.Column<long>(type: "bigint", nullable: false),
                    MessageId = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    FromAddress = table.Column<string>(type: "text", nullable: false),
                    FromName = table.Column<string>(type: "text", nullable: false),
                    ToAddresses = table.Column<string>(type: "text", nullable: false),
                    CcAddresses = table.Column<string>(type: "text", nullable: true),
                    TextBody = table.Column<string>(type: "text", nullable: true),
                    HtmlBody = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsStarred = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    HasAttachment = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxEmails", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_AccountEmail",
                table: "InboxEmails",
                column: "AccountEmail");

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_AccountEmail_Folder_Uid",
                table: "InboxEmails",
                columns: new[] { "AccountEmail", "Folder", "Uid" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_ReceivedAt",
                table: "InboxEmails",
                column: "ReceivedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InboxEmails");
        }
    }
}
