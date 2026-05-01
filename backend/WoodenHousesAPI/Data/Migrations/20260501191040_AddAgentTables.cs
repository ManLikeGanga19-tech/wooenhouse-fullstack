using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WoodenHousesAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AgentContexts",
                columns: table => new
                {
                    Key = table.Column<string>(type: "text", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    Hint = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentContexts", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "AgentTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentType = table.Column<string>(type: "text", nullable: false),
                    TriggerType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false, defaultValue: "pending_approval"),
                    ContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    QuoteId = table.Column<Guid>(type: "uuid", nullable: true),
                    InputSummary = table.Column<string>(type: "text", nullable: false),
                    DraftSubject = table.Column<string>(type: "text", nullable: false),
                    DraftBody = table.Column<string>(type: "text", nullable: false),
                    FinalSubject = table.Column<string>(type: "text", nullable: true),
                    FinalBody = table.Column<string>(type: "text", nullable: true),
                    ToAddress = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    ApprovedBy = table.Column<string>(type: "text", nullable: true),
                    RejectedBy = table.Column<string>(type: "text", nullable: true),
                    RejectionNote = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgentTasks_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AgentTasks_Quotes_QuoteId",
                        column: x => x.QuoteId,
                        principalTable: "Quotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentTasks_AgentType",
                table: "AgentTasks",
                column: "AgentType");

            migrationBuilder.CreateIndex(
                name: "IX_AgentTasks_ContactId",
                table: "AgentTasks",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_AgentTasks_CreatedAt",
                table: "AgentTasks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AgentTasks_QuoteId",
                table: "AgentTasks",
                column: "QuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_AgentTasks_Status",
                table: "AgentTasks",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentContexts");

            migrationBuilder.DropTable(
                name: "AgentTasks");
        }
    }
}
