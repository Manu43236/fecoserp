package com.fecos.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3UploadService {

    private final S3Client s3Client;

    @Value("${fecos.aws.s3-bucket}")
    private String bucket;

    @Value("${fecos.aws.region}")
    private String region;

    /**
     * Uploads a file and returns its public URL.
     *
     * @param tenantName raw company name (will be slugified)
     * @param module     folder name, e.g. "service-reports", "profile-pics"
     * @param file       the uploaded file
     */
    public String upload(String tenantName, String module, MultipartFile file) throws IOException {
        String slug = slugify(tenantName);
        String ext  = extension(file.getOriginalFilename());
        String key  = slug + "/" + module + "/" + UUID.randomUUID() + ext;

        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(req, RequestBody.fromBytes(file.getBytes()));

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    private static String slugify(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private static String extension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
