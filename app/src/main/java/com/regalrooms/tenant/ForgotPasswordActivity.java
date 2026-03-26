package com.regalrooms.tenant;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.regalrooms.tenant.databinding.ActivityForgotPasswordBinding;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.HashMap;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordActivity extends AppCompatActivity {
    private ActivityForgotPasswordBinding binding;
    private String userEmail;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityForgotPasswordBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.btnSendCode.setOnClickListener(v -> sendCode());
        binding.btnVerifyCode.setOnClickListener(v -> verifyCode());
        binding.btnResetPassword.setOnClickListener(v -> resetPassword());
        binding.tvBackToLogin.setOnClickListener(v -> finish());
    }

    private void sendCode() {
        userEmail = binding.etResetEmail.getText().toString().trim();
        if (userEmail.isEmpty()) {
            Toast.makeText(this, "Enter email", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("email", userEmail);

        RetrofitClient.getApiService().forgotPassword(body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    binding.layoutEmail.setVisibility(View.GONE);
                    binding.layoutCode.setVisibility(View.VISIBLE);
                    binding.tvTitle.setText("Enter Reset Code");
                    binding.tvDescription.setText("Check your email for the 6-digit verification code.");
                } else {
                    Toast.makeText(ForgotPasswordActivity.this, "Failed to send code", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(ForgotPasswordActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void verifyCode() {
        String code = binding.etResetCode.getText().toString().trim();
        if (code.length() != 6) {
            Toast.makeText(this, "Enter 6-digit code", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("email", userEmail);
        body.put("resetCode", code);
        body.put("userType", "tenant");

        RetrofitClient.getApiService().verifyResetCode(body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    binding.layoutCode.setVisibility(View.GONE);
                    binding.layoutPassword.setVisibility(View.VISIBLE);
                    binding.tvTitle.setText("Reset Password");
                    binding.tvDescription.setText("Create your new password.");
                } else {
                    Toast.makeText(ForgotPasswordActivity.this, "Invalid code", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(ForgotPasswordActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void resetPassword() {
        String pass = binding.etNewPassword.getText().toString().trim();
        String confirm = binding.etConfirmPassword.getText().toString().trim();
        String code = binding.etResetCode.getText().toString().trim();

        if (pass.isEmpty() || !pass.equals(confirm)) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("email", userEmail);
        body.put("resetCode", code);
        body.put("userType", "tenant");
        body.put("newPassword", pass);

        RetrofitClient.getApiService().resetPassword(body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(ForgotPasswordActivity.this, "Password Reset Successful", Toast.LENGTH_SHORT).show();
                    finish();
                } else {
                    Toast.makeText(ForgotPasswordActivity.this, "Reset failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(ForgotPasswordActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}