import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        const clientID = configService.get('oauth.google.clientID');
        const clientSecret = configService.get('oauth.google.clientSecret');
        const callbackURL = configService.get('oauth.google.callbackURL');
        const scope = ['email', 'profile'];

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('Missing required Google OAuth configuration');
        }

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope,
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            avatarUrl: photos[0].value,
            accessToken,
            refreshToken,
            id: profile.id,
        };
        done(null, user);
    }
}