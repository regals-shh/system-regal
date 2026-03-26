package com.regalrooms.tenant;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.fragment.app.Fragment;
import com.google.android.material.navigation.NavigationView;
import com.google.gson.Gson;
import com.regalrooms.tenant.databinding.ActivityMainBinding;
import com.regalrooms.tenant.fragments.*;
import com.regalrooms.tenant.models.Tenant;

public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {
    private ActivityMainBinding binding;
    private Tenant tenant;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbar);

        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(this, binding.drawerLayout, binding.toolbar,
                R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        binding.drawerLayout.addDrawerListener(toggle);
        toggle.syncState();

        binding.navView.setNavigationItemSelectedListener(this);

        updateSidebarHeader();

        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container, new DashboardFragment()).commit();
            binding.navView.setCheckedItem(R.id.nav_dashboard);
        }
    }

    /**
     * Updates the Navigation Sidebar Header with the latest tenant data from SharedPreferences.
     */
    public void updateSidebarHeader() {
        SharedPreferences prefs = getSharedPreferences("TenantPrefs", MODE_PRIVATE);
        String tenantJson = prefs.getString("tenantData", null);
        if (tenantJson != null) {
            tenant = new Gson().fromJson(tenantJson, Tenant.class);
            View headerView = binding.navView.getHeaderView(0);
            if (headerView != null) {
                TextView tvName = headerView.findViewById(R.id.tvHeaderName);
                TextView tvRoom = headerView.findViewById(R.id.tvHeaderRoom);
                
                if (tvName != null) tvName.setText(tenant.getName());
                if (tvRoom != null) tvRoom.setText("Room " + tenant.getRoomNumber());
            }
        }
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        Fragment selectedFragment = null;
        int id = item.getItemId();

        if (id == R.id.nav_dashboard) {
            selectedFragment = new DashboardFragment();
        } else if (id == R.id.nav_visitors) {
            selectedFragment = new VisitorsFragment();
        } else if (id == R.id.nav_payments) {
            selectedFragment = new PaymentsFragment();
        } else if (id == R.id.nav_maintenance) {
            selectedFragment = new MaintenanceFragment();
        } else if (id == R.id.nav_announcements) {
            selectedFragment = new AnnouncementsFragment();
        } else if (id == R.id.nav_services) {
            selectedFragment = new ServicesFragment();
        } else if (id == R.id.nav_settings) {
            selectedFragment = new SettingsFragment();
        } else if (id == R.id.nav_logout) {
            logout();
            return true;
        }

        if (selectedFragment != null) {
            getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container, selectedFragment).commit();
            binding.toolbar.setTitle(item.getTitle());
        }

        binding.drawerLayout.closeDrawer(GravityCompat.START);
        return true;
    }

    private void logout() {
        SharedPreferences prefs = getSharedPreferences("TenantPrefs", MODE_PRIVATE);
        prefs.edit().clear().apply();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    @Override
    public void onBackPressed() {
        if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }
}
