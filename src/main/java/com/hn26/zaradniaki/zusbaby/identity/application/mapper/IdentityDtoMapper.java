package com.hn26.zaradniaki.zusbaby.identity.application.mapper;

import com.hn26.zaradniaki.zusbaby.identity.application.dto.IssuedTokensDto;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.UserDto;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccount;
import com.hn26.zaradniaki.zusbaby.identity.domain.token.IssuedTokens;
import com.hn26.zaradniaki.zusbaby.shared.mapping.MapStructConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Domain results → command and query results. */
@Mapper(config = MapStructConfig.class)
public interface IdentityDtoMapper {

    @Mapping(target = "personaId", source = "identity.personaId")
    @Mapping(target = "displayName", source = "identity.displayName")
    UserDto toDto(UserAccount account);

    default IssuedTokensDto toDto(IssuedTokens tokens) {
        return new IssuedTokensDto(tokens.accessToken(), tokens.accessTokenTtl().toSeconds(), tokens.refreshToken(),
                tokens.refreshTokenTtl().toSeconds());
    }
}
