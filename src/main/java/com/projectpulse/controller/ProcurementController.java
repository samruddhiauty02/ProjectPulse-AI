
package com.projectpulse.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.projectpulse.entity.Procurement;
import com.projectpulse.entity.Project;
import com.projectpulse.repository.ProjectRepository;
import com.projectpulse.service.ProcurementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/procurements")
@CrossOrigin(origins = "*")
public class ProcurementController {

    private final ProcurementService procurementService;
    private final ProjectRepository projectRepository;

    public ProcurementController(
            ProcurementService procurementService,
            ProjectRepository projectRepository) {
        this.procurementService = procurementService;
        this.projectRepository = projectRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Procurement createProcurement(
            @Valid @RequestBody Procurement procurement,
            @RequestParam(required = false) Long projectId) {

        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Project not found with ID: " + projectId
                    ));

            procurement.setProject(project);
        }

        return procurementService.saveProcurement(procurement);
    }

    @GetMapping
    public List<Procurement> getAllProcurements() {
        return procurementService.getAllProcurements();
    }

    @GetMapping("/{id}")
    public Procurement getProcurementById(@PathVariable Long id) {
        return procurementService.getProcurementById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Procurement not found with ID: " + id
                ));
    }

    @PutMapping("/{id}")
    public Procurement updateProcurement(
            @PathVariable Long id,
            @Valid @RequestBody Procurement procurement,
            @RequestParam(required = false) Long projectId) {

        Procurement existing = procurementService.getProcurementById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Procurement not found with ID: " + id
                ));

        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Project not found with ID: " + projectId
                    ));

            procurement.setProject(project);
        } else {
            procurement.setProject(existing.getProject());
        }

        procurement.setId(existing.getId());

        return procurementService.saveProcurement(procurement);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProcurement(@PathVariable Long id) {
        procurementService.getProcurementById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Procurement not found with ID: " + id
                ));

        procurementService.deleteProcurement(id);
    }

    @GetMapping("/status/{status}")
    public List<Procurement> getByStatus(@PathVariable String status) {
        return procurementService.getProcurementsByStatus(status);
    }

    @GetMapping("/search/vendor")
    public List<Procurement> searchByVendor(@RequestParam String name) {
        return procurementService.searchByVendor(name);
    }

    @GetMapping("/search/title")
    public List<Procurement> searchByTitle(@RequestParam String name) {
        return procurementService.searchByTitle(name);
    }

    @GetMapping("/total-amount")
    public BigDecimal getTotalProcurementAmount() {
        return procurementService.getTotalProcurementAmount();
    }

    @GetMapping("/count")
    public long getTotalProcurements() {
        return procurementService.getTotalProcurements();
    }
}
