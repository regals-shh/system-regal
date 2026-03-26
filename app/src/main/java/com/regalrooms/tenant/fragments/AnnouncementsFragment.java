package com.regalrooms.tenant.fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.gson.Gson;
import com.regalrooms.tenant.adapters.AnnouncementAdapter;
import com.regalrooms.tenant.databinding.FragmentAnnouncementsBinding;
import com.regalrooms.tenant.models.Announcement;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AnnouncementsFragment extends Fragment implements AnnouncementAdapter.OnAnnouncementActionListener {
    private FragmentAnnouncementsBinding binding;
    private Tenant tenant;
    private List<Announcement> announcementList = new ArrayList<>();
    private AnnouncementAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentAnnouncementsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferences prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        String tenantJson = prefs.getString("tenantData", null);
        if (tenantJson != null) {
            tenant = new Gson().fromJson(tenantJson, Tenant.class);
        }

        if (tenant == null) return;

        binding.rvAnnouncements.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new AnnouncementAdapter(announcementList, tenant.getId(), this);
        binding.rvAnnouncements.setAdapter(adapter);

        loadAnnouncements();
    }

    private void loadAnnouncements() {
        RetrofitClient.getApiService().getAnnouncements().enqueue(new Callback<List<Announcement>>() {
            @Override
            public void onResponse(Call<List<Announcement>> call, Response<List<Announcement>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    announcementList.clear();
                    announcementList.addAll(response.body());
                    // Sort by creation date (newest first)
                    Collections.sort(announcementList, (a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
                    adapter.notifyDataSetChanged();
                    
                    // Count unseen for summary
                    int unseenCount = 0;
                    for (Announcement a : announcementList) {
                        boolean seen = false;
                        if (a.getSeenBy() != null) {
                            for (Announcement.SeenBy s : a.getSeenBy()) {
                                if (tenant.getId().equals(s.getTenantId())) {
                                    seen = true;
                                    break;
                                }
                            }
                        }
                        if (!seen) unseenCount++;
                    }
                    binding.tvAnnouncementHeader.setText("Latest Announcements (" + unseenCount + " Unseen)");
                }
            }
            @Override
            public void onFailure(Call<List<Announcement>> call, Throwable t) {
                if (getContext() != null) {
                    Toast.makeText(getContext(), "Sync Failed: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onMarkSeen(Announcement announcement) {
        Map<String, String> body = new HashMap<>();
        body.put("tenantId", tenant.getId());
        body.put("name", tenant.getName());

        RetrofitClient.getApiService().markAnnouncementSeen(announcement.getId(), body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    // Update locally first for instant feedback
                    loadAnnouncements();
                }
            }
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {}
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        loadAnnouncements(); // Refresh when returning to fragment
    }
}