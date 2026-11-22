package com.hn26.zaradniaki.zusbaby.identity.infrastructure.persistence;

import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccountRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCode;
import com.hn26.zaradniaki.zusbaby.identity.domain.login.AuthorizationCodeRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshToken;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.RefreshTokenRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/** Adapters of the identity ports on JPA. */
final class JpaIdentityRepositories {

    private JpaIdentityRepositories() {
    }

    @Repository
    @RequiredArgsConstructor
    static class Accounts implements UserAccountRepository {

        private final UserAccountJpaRepository jpa;
        private final IdentityEntityMapper mapper;

        @Override
        public Optional<UserAccount> findById(UUID id) {
            return jpa.findById(id).map(mapper::toDomain);
        }

        @Override
        public Optional<UserAccount> findBySubject(String subject) {
            return jpa.findBySubject(subject).map(mapper::toDomain);
        }

        @Override
        public void save(UserAccount account) {
            jpa.save(mapper.toEntity(account));
        }
    }

    @Repository
    @RequiredArgsConstructor
    static class Codes implements AuthorizationCodeRepository {

        private final AuthorizationCodeJpaRepository jpa;
        private final IdentityEntityMapper mapper;

        @Override
        public void save(AuthorizationCode code) {
            jpa.save(mapper.toEntity(code));
        }

        @Override
        public Optional<AuthorizationCode> take(String codeHash) {
            Optional<AuthorizationCodeEntity> entity = jpa.findById(codeHash);
            entity.ifPresent(jpa::delete);
            return entity.map(mapper::toDomain);
        }
    }

    @Repository
    @RequiredArgsConstructor
    static class RefreshTokens implements RefreshTokenRepository {

        private final RefreshTokenJpaRepository jpa;
        private final IdentityEntityMapper mapper;

        @Override
        public Optional<RefreshToken> findByHash(String tokenHash) {
            return jpa.findByTokenHash(tokenHash).map(mapper::toDomain);
        }

        @Override
        public void save(RefreshToken token) {
            jpa.save(mapper.toEntity(token));
        }
    }
}
