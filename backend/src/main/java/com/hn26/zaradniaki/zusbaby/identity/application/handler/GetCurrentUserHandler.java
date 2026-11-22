package com.hn26.zaradniaki.zusbaby.identity.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.zaradniaki.zusbaby.identity.application.dto.UserDto;
import com.hn26.zaradniaki.zusbaby.identity.application.mapper.IdentityDtoMapper;
import com.hn26.zaradniaki.zusbaby.identity.application.query.GetCurrentUserQuery;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserAccountRepository;
import com.hn26.zaradniaki.zusbaby.identity.domain.account.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
class GetCurrentUserHandler implements Command.Handler<GetCurrentUserQuery, UserDto> {

    private final UserAccountRepository accounts;
    private final IdentityDtoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public UserDto handle(GetCurrentUserQuery query) {
        return accounts.findById(query.userId()).map(mapper::toDto).orElseThrow(UserNotFoundException::new);
    }
}
