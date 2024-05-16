import {expectBodyJSON, expectEquality, expectWSMessages, closeSocket, expectNoWSMessage} from './jest-tuwien';
import {testApp, sendRequest, createSession, sendInit, joinSession, sendMessage} from './util';
import fs from "fs";
import path from "path";
const usernames = JSON.parse(fs.readFileSync(path.join(__dirname, '../server/resources/usernames.json')));

describe('Configure Together', () => {
    testApp(701, "Initialize session", async (steps, chance) => {
        const session = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(session);
        const responses = await expectWSMessages(steps, session, [
            {
                op: "ready",
                data: {
                    artworkId: session.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");
        await closeSocket(steps, session);
    });

    testApp(702, "Join session", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");
        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        const guestSession = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        const _guestReady = await expectWSMessages(steps, guestSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[1],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Guest: ");

        await expectWSMessages(steps, hostSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Host: ");

        await expectNoWSMessage(steps, hostSession, "Host: ", 500);
        await expectNoWSMessage(steps, guestSession, "Guest: ", 500);

        await closeSocket(steps, guestSession);
        await closeSocket(steps, hostSession);
    });

    testApp(703, "Update state", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");
        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        const guestSession = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        let _guestReady = await expectWSMessages(steps, guestSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[1],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Guest: ");

        await expectWSMessages(steps, hostSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Host: ");

        await expectNoWSMessage(steps, hostSession, "Host: ", 200);
        await expectNoWSMessage(steps, guestSession, "Guest: ", 200);

        steps.push("Update State");

        const updateState = {
            printSize: chance.printSize(),
            frameStyle: chance.frameStyle(),
            frameWidth: chance.frameWidth(),
            matColor: chance.matColor(),
            matWidth: chance.matWidth()
        };

        steps.push(`Host: Send Message: ${JSON.stringify({
            op: "update_state",
            data: updateState
        })}`)
        sendMessage(hostSession, {
            op: "update_state",
            data: updateState
        });

        await Promise.all(
            [
                expectWSMessages(steps, hostSession, [{op: "update_state", data: updateState}], "Host: "),
                expectWSMessages(steps, guestSession, [{op: "update_state", data: updateState}], "Guest: "),
            ]
        );

        await closeSocket(steps, guestSession);
        await closeSocket(steps, hostSession);
    });

    testApp(704, "Guest Leaves", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");
        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        const guestSession = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        let _guestReady = await expectWSMessages(steps, guestSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[1],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Guest 1: ");

        const guestSession2 = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        _guestReady = await expectWSMessages(steps, guestSession2, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[2],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1], usernames[2]]
                }
            }
        ], "Guest 2: ");

        await expectWSMessages(steps, hostSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1], usernames[2]]
                }
            }
        ], "Host: ");

        await expectWSMessages(steps, guestSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1], usernames[2]]
                }
            }
        ], "Guest 1: ");

        await expectNoWSMessage(steps, hostSession, "Host: ", 200);
        await expectNoWSMessage(steps, guestSession, "Guest 1: ", 200);
        await expectNoWSMessage(steps, guestSession2, "Guest 2: ", 200);

        steps.push("Closing connection of Guest 1");
        await closeSocket(steps, guestSession);

        await expectWSMessages(steps, hostSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[2]]
                }
            }
        ], "Host: ");
        await expectWSMessages(steps, guestSession2, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[2]]
                }
            }
        ], "Guest 2: ");

        await expectNoWSMessage(steps, hostSession, "Host: ", 200);
        await expectNoWSMessage(steps, guestSession2, "Guest 2: ", 200);

        await closeSocket(steps, hostSession);

    });

    testApp(705, "Host Leaves", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");
        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        const guestSession = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        let _guestReady = await expectWSMessages(steps, guestSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[1],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Guest: ");

        await expectWSMessages(steps, hostSession, [
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Host: ");


        await expectNoWSMessage(steps, hostSession, "Host: ", 200);
        await expectNoWSMessage(steps, guestSession, "Guest: ", 200);

        steps.push("Closing connection of Host");
        await closeSocket(steps, hostSession);

        await expectWSMessages(steps, guestSession, [
            {
                op: "done",
                data: {
                    success: false
                }
            }
        ], "Guest: ");
    });

    testApp(706, "Join with bad sessionId", async (steps, chance) => {
        const guestSession = await joinSession(steps, chance, chance.nanoid(), {port: steps.port});

        await expectWSMessages(steps, guestSession, [
            {
                op: "error",
                data: {
                    message: "Invalid session"
                }
            }
        ], "Guest: ");
    });

    testApp(707, "Join full session", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");

        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        let guestSessions = [];
        for(let i = 1; i < usernames.length; i++) {
            guestSessions.push(await joinSession(steps, chance, hostSession.sessionId, {port: steps.port}));
        }
        
        steps.push("Session is full");

        const guestSessionFull = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        await expectWSMessages(steps, guestSessionFull, [
            {
                op: "error",
                data: {
                    message: "Session full"
                }
            }
        ], "Guest who should not fit: ");

        for(let guestSession of guestSessions) {
            await closeSocket(steps, guestSession);
        }

        await closeSocket(steps, hostSession);
    });

    testApp(708, "Validate Messages", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");

        steps.push(`Host: Send bad Message Type: ${JSON.stringify({
            op: "update_stte",
            data: {}
        })}`)
        sendMessage(hostSession, {
            op: "update_stte",
            data: {}
        });

        await expectWSMessages(steps, hostSession, [
            {
                op: "error",
                data: {
                    message: "Invalid operation"
                }
            }
        ], "Host: ");

        await closeSocket(steps, hostSession)
    });

    testApp(709, "Validate State Payload", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");

        const updateState = {
            printSize: chance.printSize(),
            frameStyle: chance.frameStyle(),
            frameWidth: chance.frameWidth(),
            matColor: chance.matColor(),
            matWidth: chance.matWidth()
        };

        const randProp = {
            0: 'printSize',
            1: 'frameStyle',
            2: 'frameWidth',
            3: 'matColor',
            4: 'matWidth',
        }

        let picked = chance.randInteger(0, 4);

        updateState[randProp[picked]] = "Blub"

        steps.push(`Host: Send bad Message Payload: ${JSON.stringify({
            op: "update_state",
            data: updateState
        })}`)
        sendMessage(hostSession, {
            op: "update_state",
            data: updateState
        });

        await expectWSMessages(steps, hostSession, [
            {
                op: "error",
                data: {
                    message: "Invalid payload"
                }
            }
        ], "Host: ");

        await closeSocket(steps, hostSession)
    });

    testApp(712, "Join after end", async (steps, chance) => {
        const hostSession = await createSession(steps, chance, {port: steps.port});
        steps.push("Sending init message");
        sendInit(hostSession);
        
        const initResponses = await expectWSMessages(steps, hostSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: expect.not.stringMatching(/^$/),
                    username: usernames[0],
                }
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0]]
                }
            }
        ], "Host: ");

        hostSession.sessionId = initResponses[0].sessionId;
        hostSession.username = initResponses[0].username;

        const guestSession = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        let _guestReady = await expectWSMessages(steps, guestSession, [
            {
                op: "ready",
                data: {
                    artworkId: hostSession.artworkId,
                    sessionId: hostSession.sessionId,
                    username: usernames[1],
                }
            },
            {
                op: "update_state",
                data: hostSession.state,
            },
            {
                op: "update_users",
                data: {
                    usernames: [usernames[0], usernames[1]]
                }
            }
        ], "Guest 1: ");

        steps.push("Ending session succesfully by host");
        steps.push(`Host: Send Message: ${JSON.stringify({
            op: "done",
            data: {
                success: true
            }
        })}`)

        sendMessage(hostSession, {
            op: "done",
            data: {
                success: true
            }
        });

        await expectWSMessages(steps, guestSession, [
            {
                op: "done",
                data: {
                    success: true
                }
            }
        ], "Guest 1: ");

        steps.push("Try joining Session that has already ended");

        const guestSessionToLate = await joinSession(steps, chance, hostSession.sessionId, {port: steps.port});

        await expectWSMessages(steps, guestSessionToLate, [
            {
                op: "error",
                data: {
                    message: "Invalid session"
                }
            }
        ], "Guest who is too late: ");
    });
})