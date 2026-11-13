
package com.projectpulse.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.projectpulse.entity.Procurement;

public interface ProcurementRepository extends JpaRepository<Procurement, Long> {

    List<Procurement> findByStatusIgnoreCase(String status);

    List<Procurement> findByVendorNameContainingIgnoreCase(String vendorName);

    List<Procurement> findByTitleContainingIgnoreCase(String title);

    // GET ALL PROCUREMENTS LINKED TO A PROJECT
    List<Procurement> findByProject_Id(Long projectId);

    // GET TOTAL PROCUREMENT AMOUNT FOR A PROJECT
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Procurement p WHERE p.project.id = :projectId")
    BigDecimal getTotalProcurementAmountByProjectId(
            @Param("projectId") Long projectId
    );

    // GET TOTAL PROCUREMENT AMOUNT BY STATUS
    @Query("""
            SELECT COALESCE(SUM(p.amount), 0)
            FROM Procurement p
            WHERE UPPER(TRIM(p.status)) = UPPER(TRIM(:status))
            """)
    BigDecimal getTotalAmountByStatus(
            @Param("status") String status
    );

    // GET PROCUREMENT AMOUNT BY PROJECT AND STATUS
    @Query("""
            SELECT COALESCE(SUM(p.amount), 0)
            FROM Procurement p
            WHERE p.project.id = :projectId
            AND UPPER(TRIM(p.status)) = UPPER(TRIM(:status))
            """)
    BigDecimal getTotalAmountByProjectAndStatus(
            @Param("projectId") Long projectId,
            @Param("status") String status
    );

    // GET PROCUREMENT AMOUNTS GROUPED BY ACTUAL DATABASE STATUS
    @Query("""
            SELECT p.status, COALESCE(SUM(p.amount), 0)
            FROM Procurement p
            GROUP BY p.status
            """)
    List<Object[]> getProcurementAmountGroupedByStatus();
}
