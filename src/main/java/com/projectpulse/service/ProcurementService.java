
package com.projectpulse.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.projectpulse.entity.Procurement;
import com.projectpulse.repository.ProcurementRepository;

@Service
public class ProcurementService {

    private final ProcurementRepository procurementRepository;

    public ProcurementService(ProcurementRepository procurementRepository) {
        this.procurementRepository = procurementRepository;
    }

    // CREATE OR UPDATE PROCUREMENT
    public Procurement saveProcurement(Procurement procurement) {
        return procurementRepository.save(procurement);
    }

    // GET ALL PROCUREMENTS
    public List<Procurement> getAllProcurements() {
        return procurementRepository.findAll();
    }

    // GET PROCUREMENT BY ID
    public Optional<Procurement> getProcurementById(Long id) {
        return procurementRepository.findById(id);
    }

    // DELETE PROCUREMENT
    public void deleteProcurement(Long id) {
        procurementRepository.deleteById(id);
    }

    // GET PROCUREMENTS BY STATUS
    public List<Procurement> getProcurementsByStatus(String status) {
        return procurementRepository.findByStatusIgnoreCase(status);
    }

    // SEARCH PROCUREMENTS BY VENDOR
    public List<Procurement> searchByVendor(String vendorName) {
        return procurementRepository.findByVendorNameContainingIgnoreCase(vendorName);
    }

    // SEARCH PROCUREMENTS BY TITLE
    public List<Procurement> searchByTitle(String title) {
        return procurementRepository.findByTitleContainingIgnoreCase(title);
    }

    // CALCULATE TOTAL PROCUREMENT AMOUNT
    public BigDecimal getTotalProcurementAmount() {
        return procurementRepository.findAll()
                .stream()
                .map(Procurement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // COUNT TOTAL PROCUREMENTS
    public long getTotalProcurements() {
        return procurementRepository.count();
    }

    // GET AMOUNT BY STATUS
    public BigDecimal getAmountByStatus(String status) {
        return procurementRepository.getTotalAmountByStatus(status);
    }

    // GET PROJECT-WISE PROCUREMENT AMOUNT BY STATUS
    public BigDecimal getAmountByProjectAndStatus(
            Long projectId,
            String status) {

        return procurementRepository.getTotalAmountByProjectAndStatus(
                projectId,
                status
        );
    }

    // GET FINANCIAL SUMMARY OF ALL PROCUREMENT RECORDS
    public Map<String, Object> getFinancialSummary() {

        Map<String, Object> summary = new LinkedHashMap<>();

        BigDecimal pending = getAmountByStatus("PENDING");
        BigDecimal approved = getAmountByStatus("APPROVED");
        BigDecimal paid = getAmountByStatus("PAID");
        BigDecimal rejected = getAmountByStatus("REJECTED");

        summary.put("totalRequestedAmount", getTotalProcurementAmount());
        summary.put("pendingAmount", pending);
        summary.put("approvedAmount", approved);
        summary.put("paidAmount", paid);
        summary.put("rejectedAmount", rejected);
        summary.put("totalProcurementRecords", getTotalProcurements());

        return summary;
    }

    // GET ACTUAL PROCUREMENT AMOUNTS GROUPED BY DATABASE STATUS
    public List<Map<String, Object>> getProcurementStatusBreakdown() {

        List<Object[]> results =
                procurementRepository.getProcurementAmountGroupedByStatus();

        List<Map<String, Object>> breakdown = new ArrayList<>();

        for (Object[] result : results) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("status", result[0]);
            item.put("amount", result[1]);

            breakdown.add(item);
        }

        return breakdown;
    }
}
