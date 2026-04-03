using WoodenHousesAPI.DTOs.Auth;

namespace WoodenHousesAPI.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
