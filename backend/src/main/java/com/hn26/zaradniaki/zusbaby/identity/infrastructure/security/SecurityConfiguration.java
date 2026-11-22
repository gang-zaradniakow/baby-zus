package com.hn26.zaradniaki.zusbaby.identity.infrastructure.security;

import com.hn26.zaradniaki.zusbaby.shared.time.DateTimeGenerator;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

/**
 * Stateless API: everything is public except {@code /api/v1/me/**}, which needs
 * an access token issued by this backend (HS256 JWT).
 */
@Configuration
@EnableConfigurationProperties(IdentityProperties.class)
class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JsonMapper jsonMapper) throws Exception {
        ProblemAuthenticationEntryPoint entryPoint = new ProblemAuthenticationEntryPoint(jsonMapper);
        return http.cors(Customizer.withDefaults()).csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(requests -> requests.requestMatchers("/api/v1/me", "/api/v1/me/**")
                        .authenticated().anyRequest().permitAll())
                .oauth2ResourceServer(server -> server.authenticationEntryPoint(entryPoint)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(authenticationConverter())))
                .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(entryPoint)).build();
    }

    @Bean
    JwtEncoder jwtEncoder(IdentityProperties properties) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key(properties)));
    }

    /**
     * Expiry is checked against the application's time, the same that issued the
     * token.
     */
    @Bean
    JwtDecoder jwtDecoder(IdentityProperties properties, DateTimeGenerator dateTimeGenerator) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key(properties)).macAlgorithm(MacAlgorithm.HS256)
                .build();
        JwtTimestampValidator timestamps = new JwtTimestampValidator();
        timestamps.setClock(new GeneratorClock(dateTimeGenerator));
        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(timestamps, new JwtIssuerValidator(properties.issuer())));
        return decoder;
    }

    private static JwtAuthenticationConverter authenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName(JwtAccessTokenIssuer.ROLES_CLAIM);
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    private static SecretKey key(IdentityProperties properties) {
        return new SecretKeySpec(properties.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /** {@link Clock} view of the {@link DateTimeGenerator}. */
    private static final class GeneratorClock extends Clock {

        private final DateTimeGenerator generator;

        GeneratorClock(DateTimeGenerator generator) {
            this.generator = generator;
        }

        @Override
        public ZoneId getZone() {
            return generator.zone();
        }

        @Override
        public Clock withZone(ZoneId zone) {
            throw new UnsupportedOperationException("The application zone is fixed");
        }

        @Override
        public Instant instant() {
            return generator.now();
        }
    }
}
