package com.regalrooms.tenant.fragments;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.gson.Gson;
import com.regalrooms.tenant.R;
import com.regalrooms.tenant.adapters.ServiceAdapter;
import com.regalrooms.tenant.databinding.FragmentServicesBinding;
import com.regalrooms.tenant.models.ServiceRequest;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ServicesFragment extends Fragment implements ServiceAdapter.OnServiceActionListener {
    private FragmentServicesBinding binding;
    private Tenant tenant;
    private List<ServiceRequest> serviceRequests = new ArrayList<>();
    private ServiceAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentServicesBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferences prefs = requireActivity().getSharedPreferences("TenantPrefs", Context.MODE_PRIVATE);
        tenant = new Gson().fromJson(prefs.getString("tenantData", null), Tenant.class);

        binding.rvServiceRequests.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new ServiceAdapter(serviceRequests, this);
        binding.rvServiceRequests.setAdapter(adapter);

        binding.btnRequestParking.setOnClickListener(v -> openParkingDialog(null));
        binding.btnReserveRooftop.setOnClickListener(v -> openRooftopDialog(null));

        loadRequests();
    }

    private void loadRequests() {
        RetrofitClient.getApiService().getServiceRequests(tenant.getName()).enqueue(new Callback<List<ServiceRequest>>() {
            @Override
            public void onResponse(Call<List<ServiceRequest>> call, Response<List<ServiceRequest>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    serviceRequests.clear();
                    serviceRequests.addAll(response.body());
                    adapter.notifyDataSetChanged();
                    binding.tvServiceRequestsHeader.setText("Your Service Requests (" + serviceRequests.size() + ")");
                }
            }
            @Override
            public void onFailure(Call<List<ServiceRequest>> call, Throwable t) {}
        });
    }

    private void openParkingDialog(ServiceRequest editRequest) {
        View view = LayoutInflater.from(getContext()).inflate(R.layout.dialog_parking_request, null);
        Spinner spVehicleType = view.findViewById(R.id.spVehicleType);
        EditText etPlate = view.findViewById(R.id.etPlateNumber);
        EditText etDate = view.findViewById(R.id.etParkingDate);
        EditText etTime = view.findViewById(R.id.etParkingTime);

        // Setup vehicle type spinner
        String[] vehicleTypes = {"Select Vehicle Type", "Single", "Sidecar", "Car", "Van", "Bicycle"};
        android.widget.ArrayAdapter<String> adapter = new android.widget.ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, vehicleTypes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spVehicleType.setAdapter(adapter);

        if (editRequest != null) {
            // Set existing values
            for(int i = 0; i < vehicleTypes.length; i++) {
                if(vehicleTypes[i].equals(editRequest.getVehicle())) {
                    spVehicleType.setSelection(i);
                    break;
                }
            }
            etPlate.setText(editRequest.getPlateNumber());
            etDate.setText(editRequest.getSchedule().getDate());
            etTime.setText(editRequest.getSchedule().getTime());
        }

        // Setup date picker for parking date
        etDate.setOnClickListener(v -> showDatePicker(etDate));
        etDate.setFocusable(false); // Prevent keyboard from showing
        etDate.setFocusableInTouchMode(false);
        
        // Handle vehicle type selection to show/hide plate number
        spVehicleType.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, android.view.View view, int position, long id) {
                String selectedType = vehicleTypes[position];
                if ("Bicycle".equals(selectedType)) {
                    etPlate.setVisibility(android.view.View.GONE);
                    etPlate.setText("");
                } else {
                    etPlate.setVisibility(android.view.View.VISIBLE);
                }
            }

            @Override
            public void onNothingSelected(android.widget.AdapterView<?> parent) {}
        });

        new AlertDialog.Builder(getContext())
                .setTitle(editRequest == null ? "Parking Request" : "Edit Parking Request")
                .setView(view)
                .setPositiveButton("Submit", (dialog, which) -> {
                    String vehicleType = vehicleTypes[spVehicleType.getSelectedItemPosition()];
                    String plate = etPlate.getText().toString().trim();
                    String date = etDate.getText().toString().trim();
                    String time = etTime.getText().toString().trim();

                    if ("Select Vehicle Type".equals(vehicleType) || date.isEmpty() || time.isEmpty()) {
                        Toast.makeText(getContext(), "Please complete all required fields", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    Map<String, Object> body = new HashMap<>();
                    body.put("tenantName", tenant.getName());
                    body.put("unit", tenant.getRoomNumber());
                    body.put("type", "Parking");
                    body.put("vehicle", vehicleType);
                    if (!"Bicycle".equals(vehicleType)) {
                        body.put("plateNumber", plate);
                    }
                    Map<String, String> schedule = new HashMap<>();
                    schedule.put("date", date);
                    schedule.put("time", time);
                    body.put("schedule", schedule);

                    if (editRequest == null) {
                        RetrofitClient.getApiService().requestService(body).enqueue(new RequestCallback());
                    } else {
                        RetrofitClient.getApiService().updateService(editRequest.getId(), body).enqueue(new RequestCallback());
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void openRooftopDialog(ServiceRequest editRequest) {
        View view = LayoutInflater.from(getContext()).inflate(R.layout.dialog_rooftop_request, null);
        EditText etDate = view.findViewById(R.id.etRooftopDate);
        EditText etTime = view.findViewById(R.id.etRooftopTime);
        EditText etDetails = view.findViewById(R.id.etRooftopPurpose);

        if (editRequest != null) {
            etDate.setText(editRequest.getSchedule().getDate());
            etTime.setText(editRequest.getSchedule().getTime());
            etDetails.setText(editRequest.getDetails());
        }

        // Setup date picker for rooftop date
        etDate.setOnClickListener(v -> showDatePicker(etDate));
        etDate.setFocusable(false); // Prevent keyboard from showing
        etDate.setFocusableInTouchMode(false);

        new AlertDialog.Builder(getContext())
                .setTitle(editRequest == null ? "Rooftop Reservation" : "Edit Rooftop Reservation")
                .setView(view)
                .setPositiveButton("Submit", (dialog, which) -> {
                    Map<String, Object> body = new HashMap<>();
                    body.put("tenantName", tenant.getName());
                    body.put("unit", tenant.getRoomNumber());
                    body.put("type", "Rooftop");
                    body.put("details", etDetails.getText().toString());
                    Map<String, String> schedule = new HashMap<>();
                    schedule.put("date", etDate.getText().toString());
                    schedule.put("time", etTime.getText().toString());
                    body.put("schedule", schedule);

                    if (editRequest == null) {
                        RetrofitClient.getApiService().requestService(body).enqueue(new RequestCallback());
                    } else {
                        RetrofitClient.getApiService().updateService(editRequest.getId(), body).enqueue(new RequestCallback());
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private class RequestCallback implements Callback<ResponseBody> {
        @Override
        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
            if (response.isSuccessful()) {
                loadRequests();
                Toast.makeText(getContext(), "Success", Toast.LENGTH_SHORT).show();
            }
        }
        @Override
        public void onFailure(Call<ResponseBody> call, Throwable t) {}
    }

    @Override
    public void onEdit(ServiceRequest request) {
        if ("Parking".equalsIgnoreCase(request.getType())) {
            openParkingDialog(request);
        } else {
            openRooftopDialog(request);
        }
    }

    @Override
    public void onCancel(ServiceRequest request) {
        new AlertDialog.Builder(getContext())
                .setTitle("Cancel Request")
                .setMessage("Are you sure you want to cancel this reservation?")
                .setPositiveButton("Yes", (dialog, which) -> {
                    RetrofitClient.getApiService().deleteService(request.getId()).enqueue(new RequestCallback());
                })
                .setNegativeButton("No", null)
                .show();
    }

    private void showDatePicker(EditText dateField) {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                requireContext(),
                (view, selectedYear, selectedMonth, selectedDay) -> {
                    // Format date as YYYY-MM-DD to match website format
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                    Calendar selectedCalendar = Calendar.getInstance();
                    selectedCalendar.set(selectedYear, selectedMonth, selectedDay);
                    
                    // Check if selected date is in the past
                    Calendar today = Calendar.getInstance();
                    today.set(Calendar.HOUR_OF_DAY, 0);
                    today.set(Calendar.MINUTE, 0);
                    today.set(Calendar.SECOND, 0);
                    today.set(Calendar.MILLISECOND, 0);
                    
                    selectedCalendar.set(Calendar.HOUR_OF_DAY, 0);
                    selectedCalendar.set(Calendar.MINUTE, 0);
                    selectedCalendar.set(Calendar.SECOND, 0);
                    selectedCalendar.set(Calendar.MILLISECOND, 0);
                    
                    if (selectedCalendar.before(today)) {
                        Toast.makeText(getContext(), "You cannot select a past date", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    
                    String formattedDate = dateFormat.format(selectedCalendar.getTime());
                    dateField.setText(formattedDate);
                },
                year, month, day
        );

        // Prevent selection of past dates
        datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);
        datePickerDialog.show();
    }
}