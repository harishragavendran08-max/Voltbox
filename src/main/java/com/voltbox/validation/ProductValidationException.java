package com.voltbox.validation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Domain exception thrown when a product creation, modification, SKU assignment,
 * or warehouse stock mutation violates server-side validation rules.
 * Ensures invalid modifications are rejected before mutating {@code voltbox-data.json}.
 */
public class ProductValidationException extends RuntimeException {

    public static class FieldViolation {
        private final String field;
        private final String code;
        private final String message;
        private final Object rejectedValue;

        public FieldViolation(String field, String code, String message, Object rejectedValue) {
            this.field = field;
            this.code = code;
            this.message = message;
            this.rejectedValue = rejectedValue;
        }

        public String getField() {
            return field;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public Object getRejectedValue() {
            return rejectedValue;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("field", field);
            map.put("code", code);
            map.put("message", message);
            map.put("rejectedValue", rejectedValue);
            return map;
        }
    }

    private final String errorCode;
    private final List<FieldViolation> violations;

    public ProductValidationException(String errorCode, String message, List<FieldViolation> violations) {
        super(message);
        this.errorCode = errorCode != null ? errorCode : "VALIDATION_ERROR";
        this.violations = violations != null
                ? Collections.unmodifiableList(new ArrayList<>(violations))
                : Collections.emptyList();
    }

    public ProductValidationException(String field, String code, String message, Object rejectedValue) {
        this(
                code,
                message,
                List.of(new FieldViolation(field, code, message, rejectedValue))
        );
    }

    public String getErrorCode() {
        return errorCode;
    }

    public List<FieldViolation> getViolations() {
        return violations;
    }

    public Map<String, Object> toResponsePayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("ok", false);
        payload.put("code", errorCode);
        payload.put("message", getMessage());
        List<Map<String, Object>> errorList = new ArrayList<>(violations.size());
        for (FieldViolation v : violations) {
            errorList.add(v.toMap());
        }
        payload.put("errors", errorList);
        payload.put("timestamp", System.currentTimeMillis());
        return payload;
    }
}
