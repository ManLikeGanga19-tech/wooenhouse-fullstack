using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class MailboxTwoWaySync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InboxEmails_AccountEmail_Folder_Uid",
                table: "InboxEmails");

            migrationBuilder.AlterColumn<long>(
                name: "Uid",
                table: "InboxEmails",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<string>(
                name: "FolderPath",
                table: "InboxEmails",
                type: "text",
                nullable: false,
                defaultValue: "");

            // InboxEmails is a cache of the IMAP mailboxes. The old rows were
            // stored without their real folder path or UIDVALIDITY, so they can't
            // be reconciled — drop them and let the next sync rebuild them.
            // Keep the dashboard-composed Sent rows: they never reached the
            // server, and were stored with a unix-timestamp "UID" (> 1e9) that
            // froze Sent syncing. Their UID is cleared so they stay local-only.
            migrationBuilder.Sql("""
                DELETE FROM "InboxEmails" WHERE NOT ("Folder" = 'sent' AND "Uid" > 1000000000);
                UPDATE "InboxEmails" SET "Uid" = NULL;
                """);

            migrationBuilder.CreateTable(
                name: "MailboxAccountStatuses",
                columns: table => new
                {
                    AccountEmail = table.Column<string>(type: "text", nullable: false),
                    LastAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSuccessAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MailboxAccountStatuses", x => x.AccountEmail);
                });

            migrationBuilder.CreateTable(
                name: "MailboxFolderStates",
                columns: table => new
                {
                    AccountEmail = table.Column<string>(type: "text", nullable: false),
                    FolderPath = table.Column<string>(type: "text", nullable: false),
                    UidValidity = table.Column<long>(type: "bigint", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MailboxFolderStates", x => new { x.AccountEmail, x.FolderPath });
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_AccountEmail_Folder",
                table: "InboxEmails",
                columns: new[] { "AccountEmail", "Folder" });

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_AccountEmail_FolderPath_Uid",
                table: "InboxEmails",
                columns: new[] { "AccountEmail", "FolderPath", "Uid" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MailboxAccountStatuses");

            migrationBuilder.DropTable(
                name: "MailboxFolderStates");

            migrationBuilder.DropIndex(
                name: "IX_InboxEmails_AccountEmail_Folder",
                table: "InboxEmails");

            migrationBuilder.DropIndex(
                name: "IX_InboxEmails_AccountEmail_FolderPath_Uid",
                table: "InboxEmails");

            // The old schema needs a non-null UID; rows that never reached the
            // server can't be represented, and synced rows are re-fetched anyway.
            migrationBuilder.Sql("""DELETE FROM "InboxEmails" WHERE "Uid" IS NULL;""");

            migrationBuilder.DropColumn(
                name: "FolderPath",
                table: "InboxEmails");

            migrationBuilder.AlterColumn<long>(
                name: "Uid",
                table: "InboxEmails",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboxEmails_AccountEmail_Folder_Uid",
                table: "InboxEmails",
                columns: new[] { "AccountEmail", "Folder", "Uid" },
                unique: true);
        }
    }
}
