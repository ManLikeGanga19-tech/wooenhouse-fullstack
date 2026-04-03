using Microsoft.EntityFrameworkCore;
using WoodenHousesAPI.Models;

namespace WoodenHousesAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser>             AdminUsers             => Set<AdminUser>();
    public DbSet<Contact>               Contacts               => Set<Contact>();
    public DbSet<Quote>                 Quotes                 => Set<Quote>();
    public DbSet<QuoteLineItem>         QuoteLineItems         => Set<QuoteLineItem>();
    public DbSet<NewsletterSubscriber>  NewsletterSubscribers  => Set<NewsletterSubscriber>();
    public DbSet<Project>               Projects               => Set<Project>();
    public DbSet<Service>               Services               => Set<Service>();
    public DbSet<SiteSetting>           SiteSettings           => Set<SiteSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Contact
        modelBuilder.Entity<Contact>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Status).HasDefaultValue("new");
            e.Property(c => c.Priority).HasDefaultValue("medium");
            e.Property(c => c.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(c => c.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // Quote
        modelBuilder.Entity<Quote>(e =>
        {
            e.HasKey(q => q.Id);
            e.HasOne(q => q.Contact)
             .WithMany(c => c.Quotes)
             .HasForeignKey(q => q.ContactId)
             .OnDelete(DeleteBehavior.SetNull);
            e.Property(q => q.Status).HasDefaultValue("draft");
            e.Property(q => q.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(q => q.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // QuoteLineItem
        modelBuilder.Entity<QuoteLineItem>(e =>
        {
            e.HasKey(li => li.Id);
            e.HasOne(li => li.Quote)
             .WithMany(q => q.LineItems)
             .HasForeignKey(li => li.QuoteId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // NewsletterSubscriber
        modelBuilder.Entity<NewsletterSubscriber>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Email).IsUnique();
            e.Property(s => s.Status).HasDefaultValue("active");
            e.Property(s => s.SubscribedAt).HasDefaultValueSql("NOW()");
        });

        // Project
        modelBuilder.Entity<Project>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Slug).IsUnique();
            e.Property(p => p.Status).HasDefaultValue("published");
            e.Property(p => p.Featured).HasDefaultValue(false);
            e.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(p => p.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // Service
        modelBuilder.Entity<Service>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Slug).IsUnique();
            e.Property(s => s.Status).HasDefaultValue("published");
            e.Property(s => s.SortOrder).HasDefaultValue(0);
            e.Property(s => s.CreatedAt).HasDefaultValueSql("NOW()");
            e.Property(s => s.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // SiteSetting
        modelBuilder.Entity<SiteSetting>(e =>
        {
            e.HasKey(s => s.Key);
        });

        // AdminUser
        modelBuilder.Entity<AdminUser>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("admin");
            e.Property(u => u.CreatedAt).HasDefaultValueSql("NOW()");
        });
    }
}
