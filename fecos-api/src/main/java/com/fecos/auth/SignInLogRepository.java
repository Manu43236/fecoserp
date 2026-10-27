package com.fecos.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SignInLogRepository extends JpaRepository<SignInLogEntity, UUID> {

    @Query("SELECT s.userId, MAX(s.signedInAt) FROM SignInLogEntity s GROUP BY s.userId")
    List<Object[]> findLastSignInPerUser();

    Page<SignInLogEntity> findAllByOrderBySignedInAtDesc(Pageable pageable);
}
