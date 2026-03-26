package com.regalrooms.tenant.fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.gson.Gson;
import com.regalrooms.tenant.adapters.InvoiceAdapter;
import com.regalrooms.tenant.databinding.FragmentPaymentsBinding;
import com.regalrooms.tenant.models.Invoice;
import com.regalrooms.tenant.models.Tenant;
import com.regalrooms.tenant.network.RetrofitClient;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PaymentsFragment extends Fragment implements InvoiceAdapter.OnInvoiceActionListener {
    private static final String TAG = "PaymentsFragment";
    private FragmentPaymentsBinding binding;
    private Tenant tenant;
    private List<Invoice> invoiceList = new ArrayList<>();
    private InvoiceAdapter adapter;
    private String selectedInvoiceId;

    // Use the modern Photo Picker
    private final ActivityResultLauncher<PickVisualMediaRequest> pickMedia =
            registerForActivityResult(new ActivityResultContracts.PickVisualMedia(), uri -> {
                if (uri != null) {
                    Log.d(TAG, "Selected URI: " + uri);
                    uploadImage(uri);
                } else {
                    Log.d(TAG, "No media selected");
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentPaymentsBinding.inflate(inflater, container, false);
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

        binding.rvInvoices.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new InvoiceAdapter(invoiceList, this);
        binding.rvInvoices.setAdapter(adapter);

        binding.btnUploadProof.setOnClickListener(v -> {
            Invoice pending = findPendingInvoice();
            if (pending != null) {
                selectedInvoiceId = pending.getId();
                openGallery();
            } else {
                Toast.makeText(getContext(), "No pending invoice found", Toast.LENGTH_SHORT).show();
            }
        });

        loadInvoices();
    }

    private Invoice findPendingInvoice() {
        for (Invoice i : invoiceList) {
            if (!"Paid".equalsIgnoreCase(i.getStatus())) return i;
        }
        return null;
    }

    private void loadInvoices() {
        if (tenant == null || tenant.getRoomNumber() == null) return;
        
        RetrofitClient.getApiService().getInvoices(tenant.getRoomNumber()).enqueue(new Callback<List<Invoice>>() {
            @Override
            public void onResponse(Call<List<Invoice>> call, Response<List<Invoice>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    invoiceList.clear();
                    invoiceList.addAll(response.body());
                    Collections.sort(invoiceList, (a, b) -> b.getDueDate().compareTo(a.getDueDate()));
                    adapter.notifyDataSetChanged();
                    updateBalance();
                }
            }
            @Override
            public void onFailure(Call<List<Invoice>> call, Throwable t) {
                Log.e(TAG, "Load Invoices Failed", t);
            }
        });
    }

    private void updateBalance() {
        double total = 0;
        for (Invoice i : invoiceList) {
            if (!"Paid".equalsIgnoreCase(i.getStatus())) total += i.getAmount();
        }
        binding.tvBalance.setText("₱" + String.format(Locale.getDefault(), "%,.2f", total));
    }

    private void openGallery() {
        pickMedia.launch(new PickVisualMediaRequest.Builder()
                .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly.INSTANCE)
                .build());
    }

    private void uploadImage(Uri uri) {
        try {
            Log.d(TAG, "Starting upload for URI: " + uri);
            
            File file = uriToFile(uri);
            if (file == null) {
                Log.e(TAG, "Failed to convert URI to file");
                Toast.makeText(getContext(), "Error preparing image: Could not process file", Toast.LENGTH_LONG).show();
                return;
            }
            
            Log.d(TAG, "File created: " + file.getAbsolutePath() + ", size: " + file.length() + " bytes");

            Toast.makeText(getContext(), "Uploading proof...", Toast.LENGTH_SHORT).show();

            // Fix: Use proper MediaType and ensure it's not null
            MediaType mediaType = MediaType.parse("image/jpeg");
            if (mediaType == null) {
                mediaType = MediaType.parse("image/*");
            }
            if (mediaType == null) {
                mediaType = MediaType.parse("application/octet-stream");
            }
            
            RequestBody requestFile = RequestBody.create(mediaType, file);
            MultipartBody.Part body = MultipartBody.Part.createFormData("proof", file.getName(), requestFile);

            Log.d(TAG, "Starting API call to upload payment for invoice: " + selectedInvoiceId);

            RetrofitClient.getApiService().uploadPayment(selectedInvoiceId, body).enqueue(new Callback<ResponseBody>() {
                @Override
                public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                    Log.d(TAG, "Upload response received - Code: " + response.code() + ", Successful: " + response.isSuccessful());
                    
                    if (response.isSuccessful()) {
                        Toast.makeText(getContext(), "Proof Uploaded Successfully", Toast.LENGTH_SHORT).show();
                        loadInvoices();
                    } else {
                        String errorBody = "";
                        try { 
                            errorBody = response.errorBody().string(); 
                            Log.e(TAG, "Error response body: " + errorBody);
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to read error body", e);
                        }
                        Log.e(TAG, "Upload failed: " + response.code() + " " + errorBody);
                        Toast.makeText(getContext(), "Upload failed: " + response.code(), Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<ResponseBody> call, Throwable t) {
                    Log.e(TAG, "Network error during upload", t);
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error processing image", e);
            Toast.makeText(getContext(), "Error processing image: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private File uriToFile(Uri uri) {
        try {
            Log.d(TAG, "Converting URI to file: " + uri);
            
            InputStream is = getContext().getContentResolver().openInputStream(uri);
            if (is == null) {
                Log.e(TAG, "Failed to open input stream for URI: " + uri);
                return null;
            }
            
            // Get file extension from URI or default to jpg
            String extension = "jpg";
            String mimeType = getContext().getContentResolver().getType(uri);
            if (mimeType != null) {
                switch (mimeType) {
                    case "image/png":
                        extension = "png";
                        break;
                    case "image/jpeg":
                        extension = "jpg";
                        break;
                    case "image/webp":
                        extension = "webp";
                        break;
                    default:
                        extension = "jpg";
                        break;
                }
            }
            
            File file = new File(getContext().getCacheDir(), "temp_proof_" + System.currentTimeMillis() + "." + extension);
            Log.d(TAG, "Creating temp file: " + file.getAbsolutePath());
            
            FileOutputStream fos = new FileOutputStream(file);
            byte[] buffer = new byte[4096]; // Increased buffer size for better performance
            int len;
            while ((len = is.read(buffer)) != -1) {
                fos.write(buffer, 0, len);
            }
            fos.flush(); // Ensure all data is written
            fos.close();
            is.close();
            
            Log.d(TAG, "File conversion successful. File size: " + file.length() + " bytes");
            return file;
        } catch (Exception e) {
            Log.e(TAG, "Error converting URI to file", e);
            return null;
        }
    }

    @Override
    public void onChangeProof(Invoice invoice) {
        selectedInvoiceId = invoice.getId();
        openGallery();
    }

    @Override
    public void onDeleteProof(Invoice invoice) {
        new androidx.appcompat.app.AlertDialog.Builder(getContext())
                .setTitle("Delete Proof")
                .setMessage("Are you sure you want to delete this payment proof?")
                .setPositiveButton("Delete", (dialog, which) -> {
                    deleteProof(invoice.getId());
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void deleteProof(String invoiceId) {
        Toast.makeText(getContext(), "Deleting proof...", Toast.LENGTH_SHORT).show();
        
        RetrofitClient.getApiService().deleteProof(invoiceId).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Proof deleted successfully", Toast.LENGTH_SHORT).show();
                    loadInvoices();
                } else {
                    String errorBody = "";
                    try {
                        errorBody = response.errorBody().string();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to read error body", e);
                    }
                    Log.e(TAG, "Delete failed: " + response.code() + " " + errorBody);
                    Toast.makeText(getContext(), "Delete failed: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Log.e(TAG, "Network error during delete", t);
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
