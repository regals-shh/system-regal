package com.regalrooms.tenant;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.gson.Gson;
import com.regalrooms.tenant.databinding.ActivityLoginBinding;
import com.regalrooms.tenant.models.LoginResponse;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {
    private ActivityLoginBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Check if already logged in
        SharedPreferences prefs = getSharedPreferences("TenantPrefs", MODE_PRIVATE);
        if (prefs.getString("tenantId", null) != null) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
        }

        binding.btnLogin.setOnClickListener(v -> login());
        binding.tvForgotPassword.setOnClickListener(v -> startActivity(new Intent(this, ForgotPasswordActivity.class)));
    }

    private void login() {
        String email = binding.etEmail.getText().toString().trim();
        String password = binding.etPassword.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);

        RetrofitClient.getApiService().login(body).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse res = response.body();
                    SharedPreferences prefs = getSharedPreferences("TenantPrefs", MODE_PRIVATE);
                    SharedPreferences.Editor editor = prefs.edit();
                    editor.putString("tenantId", res.getTenant().getId());
                    editor.putString("tenantData", new Gson().toJson(res.getTenant()));
                    editor.apply();

                    Toast.makeText(LoginActivity.this, "Login Successful", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                    finish();
                } else {
                    Toast.makeText(LoginActivity.this, "Invalid Credentials", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                String errorMsg = "Server Connection Failed: " + t.getMessage();
                System.err.println("Login Error: " + errorMsg);
                System.err.println("Request URL: " + call.request().url());
                t.printStackTrace();
                Toast.makeText(LoginActivity.this, errorMsg, Toast.LENGTH_LONG).show();
            }
        });
    }
}