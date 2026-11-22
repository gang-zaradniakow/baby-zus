package com.hn26.zaradniaki.zusbaby.shared.web;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Web settings.
 * @param allowedOrigins frontend origins allowed to call {@code /api/**} from
 *            the browser (CORS)
 */
@ConfigurationProperties("zusbaby.web")
public record WebProperties(List<String> allowedOrigins) {

    public WebProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
