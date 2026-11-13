
package com.projectpulse.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.projectpulse.service.GeminiService;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AIController {

    private static final Logger logger =
            LoggerFactory.getLogger(AIController.class);

    private final GeminiService geminiService;

    public AIController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askQuestion(
            @RequestBody Map<String, String> request) {

        String question = request.get("question");

        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Question cannot be empty.")
            );
        }

        try {
            String answer = geminiService.generateResponse(question);

            return ResponseEntity.ok(
                    Map.of("question", question, "answer", answer)
            );

        } catch (Exception e) {
            logger.error("Gemini API request failed", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error",
                            "Unable to generate an AI response. Check backend logs."
                    ));
        }
    }
}
