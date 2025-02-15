import { useMsal } from '@azure/msal-react';
import {
    Body1,
    Body1Strong,
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Input,
    Persona,
    Text,
    makeStyles,
} from '@fluentui/react-components';
import { Dismiss20Regular } from '@fluentui/react-icons';
import { FormEvent, useState } from 'react';
import { TokenHelper } from '../../libs/auth/TokenHelper';
import { useAppDispatch } from '../../redux/app/hooks';
import { AdditionalApiProperties, PluginAuthRequirements, Plugins } from '../../redux/features/plugins/PluginsState';
import { connectPlugin } from '../../redux/features/plugins/pluginsSlice';

const useClasses = makeStyles({
    root: {
        height: '515px',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: '10px',
    },
    scopes: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: '5px',
        paddingLeft: '20px',
    },
    error: {
        color: '#d13438',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        rowGap: '10px',
    },
});

interface PluginConnectorProps {
    name: Plugins;
    icon: string;
    publisher: string;
    authRequirements: PluginAuthRequirements;
    apiProperties?: AdditionalApiProperties;
}

export const PluginConnector: React.FC<PluginConnectorProps> = ({
    name,
    icon,
    publisher,
    authRequirements,
    apiProperties,
}) => {
    const classes = useClasses();

    const usernameRequired = authRequirements.username;
    const passwordRequired = authRequirements.password;
    const accessTokenRequired = authRequirements.personalAccessToken;
    const msalRequired = authRequirements.Msal;
    const oauthRequired = authRequirements.OAuth;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [apiPropertiesInput, setApiRequirementsInput] = useState(apiProperties);

    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const dispatch = useAppDispatch();
    const { instance, inProgress } = useMsal();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            if (msalRequired) {
                const token = await TokenHelper.getAccessTokenUsingMsal(inProgress, instance, authRequirements.scopes!);
                dispatch(
                    connectPlugin({
                        plugin: name,
                        accessToken: token,
                        apiProperties: apiPropertiesInput,
                    }),
                );
            } else if (oauthRequired) {
                // TODO: implement OAuth Flow
            } else {
                // Basic Auth or PAT
                dispatch(
                    connectPlugin({
                        plugin: name,
                        username: username,
                        password: password,
                        accessToken: accessToken,
                        apiProperties: apiPropertiesInput,
                    }),
                );
            }

            setOpen(false);
        } catch (_e) {
            setErrorMessage(`Could not authenticate to ${name}. Check your permissions and try again.`);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(_event, data) => {
                setErrorMessage(undefined);
                setOpen(data.open);
            }}
            modalType="alert"
        >
            <DialogTrigger>
                <Button aria-label="Enable plugin" appearance="primary">
                    Enable
                </Button>
            </DialogTrigger>
            <DialogSurface>
                <form onSubmit={handleSubmit}>
                    <DialogBody className={classes.root}>
                        <DialogTitle
                            action={
                                <DialogTrigger action="close">
                                    <Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} />
                                </DialogTrigger>
                            }
                        >
                            <Persona
                                size="huge"
                                name={name}
                                avatar={{
                                    image: {
                                        src: icon,
                                    },
                                    initials: '', // Set to empty string so no initials are rendered behind image
                                }}
                                secondaryText={`${publisher} | Semantic Kernel Skills`}
                            />
                        </DialogTitle>
                        <DialogContent className={classes.content}>
                            {errorMessage && <Body1 className={classes.error}>{errorMessage}</Body1>}
                            You are about to enable {name}.{' '}
                            {authRequirements.scopes && (
                                <>
                                    To continue, you will authorize the following:{' '}
                                    <div className={classes.scopes}>
                                        {authRequirements.scopes?.map((scope) => {
                                            return <Text key={scope}>{scope}</Text>;
                                        })}
                                    </div>
                                </>
                            )}
                            {(usernameRequired || accessTokenRequired) && (
                                <Body1Strong> Log in to {name} to continue</Body1Strong>
                            )}
                            {(msalRequired || oauthRequired) && (
                                <Body1>
                                    {' '}
                                    You will be prompted into sign in with {publisher} on the next screen if you haven't
                                    already provided prior consent.
                                </Body1>
                            )}
                            {usernameRequired && (
                                <>
                                    <Input
                                        required
                                        type="text"
                                        id={'plugin-username-input'}
                                        value={username}
                                        onChange={(_e, input) => {
                                            setUsername(input.value);
                                        }}
                                        placeholder={`Enter your ${name} username`}
                                    />
                                </>
                            )}
                            {passwordRequired && (
                                <>
                                    <Input
                                        required
                                        type="text"
                                        id={'plugin-password-input'}
                                        value={password}
                                        onChange={(_e, input) => {
                                            setPassword(input.value);
                                        }}
                                        placeholder={`Enter your ${name} password`}
                                    />
                                </>
                            )}
                            {accessTokenRequired && (
                                <>
                                    <Input
                                        required
                                        type="password"
                                        id={'plugin-pat-input'}
                                        value={accessToken}
                                        onChange={(_e, input) => {
                                            setAccessToken(input.value);
                                        }}
                                        placeholder={`Enter your ${name} Personal Access Token`}
                                    />
                                    <Body1>
                                        For more information on how to generate a PAT for {name},{' '}
                                        <a href={authRequirements.helpLink} target="_blank" rel="noreferrer noopener">
                                            click here
                                        </a>
                                        .
                                    </Body1>
                                </>
                            )}
                            {apiProperties && (
                                <>
                                    <Body1Strong> Configuration </Body1Strong>
                                    <Body1>Some additional information is required to enable {name}'s REST APIs.</Body1>
                                    {Object.keys(apiProperties).map((property) => {
                                        const propertyDetails = apiPropertiesInput![property];
                                        return (
                                            <div className={classes.section} key={property}>
                                                <Input
                                                    key={property}
                                                    required={propertyDetails.required}
                                                    type="text"
                                                    id={'plugin-additional-info' + property}
                                                    onChange={(_e, input) => {
                                                        setApiRequirementsInput({
                                                            ...apiPropertiesInput,
                                                            [property]: {
                                                                ...propertyDetails,
                                                                value: input.value,
                                                            },
                                                        });
                                                    }}
                                                    placeholder={`Enter the ${propertyDetails.description ?? property}`}
                                                />
                                                {propertyDetails.helpLink && (
                                                    <Body1>
                                                        For more details on obtaining this information,{' '}
                                                        <a
                                                            href={propertyDetails.helpLink}
                                                            target="_blank"
                                                            rel="noreferrer noopener"
                                                        >
                                                            click here
                                                        </a>
                                                        .
                                                    </Body1>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger>
                                <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button type="submit" appearance="primary" disabled={!!errorMessage}>
                                Enable
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </form>
            </DialogSurface>
        </Dialog>
    );
};
