package com.fecos.upload;

import com.fecos.common.ApiResponse;
import com.fecos.tenant.TenantRepository;
import com.fecos.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final S3UploadService s3;
    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;

    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", upload(file, "service-reports"))));
    }

    @PostMapping("/signature")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadSignature(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", upload(file, "service-reports"))));
    }

    @PostMapping("/sample-photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadSamplePhoto(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", upload(file, "service-reports"))));
    }

    @PostMapping("/profile-pic")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePic(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", upload(file, "profile-pics"))));
    }

    @PostMapping("/vehicle-pic")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVehiclePic(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", upload(file, "vehicle-pics"))));
    }

    private String upload(MultipartFile file, String module) throws IOException {
        UUID userId   = UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
        UUID tenantId = userRepo.findById(userId).orElseThrow().getTenantId();
        String name   = tenantRepo.findByIdAndIsDeletedFalse(tenantId).orElseThrow().getCompanyName();
        return s3.upload(name, module, file);
    }
}
