import { BotDeclaration, PreventIframe } from "express-msteams-host";
import * as debug from "debug";
import { DialogSet, DialogState } from "botbuilder-dialogs";
import { StatePropertyAccessor, CardFactory, TurnContext,  MessageFactory,
    MemoryStorage, ConversationState, ActivityTypes, TeamsActivityHandler } from "botbuilder";
import HelpDialog from "./dialogs/HelpDialog";
import WelcomeCard from "./dialogs/WelcomeDialog";
import FeelingsCard from "./dialogs/FeelingsCard";
import PomodoroCard from "./dialogs/PomodoroCard";
import WelcomeTeammateCard from "./dialogs/WelcomeTeammateCard";
import CountdownCard from "./dialogs/CountDownCard";
import BreakCard from "./dialogs/BreakCard";

// Initialize debug logging module
const log = debug("msteams");

/**
 * Implementation for Teammate Bot
 */
@BotDeclaration(
    "/api/messages",
    new MemoryStorage(),
    // eslint-disable-next-line no-undef
    process.env.MICROSOFT_APP_ID,
    // eslint-disable-next-line no-undef
    process.env.MICROSOFT_APP_PASSWORD)
@PreventIframe("/teammateBot/teammateBot.html")
export class TeammateBot extends TeamsActivityHandler {
    private readonly conversationState: ConversationState;
    private readonly dialogs: DialogSet;
    private dialogState: StatePropertyAccessor<DialogState>;

    /**
     * The constructor
     * @param conversationState
     */
    public constructor(conversationState: ConversationState) {
        super();

        this.conversationState = conversationState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new HelpDialog("help"));
        // Set up the Activity processing
        this.onMessage(async (context: TurnContext): Promise<void> => {
            // TODO: add your own bot logic in here
            switch (context.activity.type) {
                case ActivityTypes.Message:
                    {
                        // if a value property exists = adaptive card submit action
                        if (context.activity.value) {
                            console.log(context.activity.value);
                            

                            switch (context.activity.value.welcomeChoice) {
                                case "study":
                                    await context.sendActivity("School stuff, got it! I can help you with that!");
                                  break;
                                case "work":
                                    await context.sendActivity("Busy at work right? Got it! I can help you with that!");
                                  break;
                            }

                            switch (context.activity.value.feelingChoice) {
                                case "happy":
                                    await context.sendActivity("Great! 3 days in a row. Keep going.");
                                break;
                                case "tongue":
                                    await context.sendActivity("Tongue!");
                                break;
                                case "shy":
                                    await context.sendActivity("Shy!");
                                break;
                                case "thinking":
                                    await context.sendActivity("Thinking!");
                                break;
                                case "sleep":
                                    await context.sendActivity("Yeah, sometimes I get tired too. Would you like to do an exercise to shake it up?");
                                break;
                                case "said":
                                    await context.sendActivity("I'm here for you. Would you like to hear a joke?");
                                break;
                            }

                            if(context.activity.value.startPomodoro){
                                await context.sendActivity("Let's do it! I will notify you when the 25 minutes is up.");
                            }

                        }else{

                            let text = TurnContext.removeRecipientMention(context.activity);
                            text = text.toLowerCase();

                            if (text.startsWith("hello")) {
                                await context.sendActivity("Oh, hello to you as well!");
    
                                const feelingsCard = CardFactory.adaptiveCard(FeelingsCard);
                                await context.sendActivity({ attachments: [feelingsCard] });
                                return;
                            } else if (text.startsWith("help")) {
                                const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
                                await context.sendActivity({ attachments: [welcomeCard] });
                            }else if (text.startsWith("add task")) {
                                await context.sendActivity("Send Add Task form!");
                            }
                            else if (text.startsWith("add meeting")) {
                                await context.sendActivity("Send add Meeting form!");
                            } 
                            else if (text.startsWith("my meeting")) {
                                await context.sendActivity("Send next meetings for the day.");
                            }else if (text.indexOf("pomodoro") !== -1) {
    
                                const pomodoroCard = CardFactory.adaptiveCard(PomodoroCard);
                                await context.sendActivity({ attachments: [pomodoroCard] });
                            } else if (text.indexOf("feeling") !== -1) {
                                const feelingsCard = CardFactory.adaptiveCard(FeelingsCard);
                                await context.sendActivity({ attachments: [feelingsCard] });
                            }else if (text.indexOf("school stuff") !== -1 || text.indexOf("skool stuff") !== -1 ) {
                                await context.sendActivity("School stuff, got it! I can help you with that!");
                            }else if (text.indexOf("work stuff") !== -1 || text.indexOf("work stuff") !== -1 ) {
                                await context.sendActivity("Busy at work right? Got it! I can help you with that!");
                            }
                            else if (text.indexOf("hero") !== -1) {
                                const card = CardFactory.heroCard(
                                    'White T-Shirt',
                                    ['https://example.com/whiteShirt.jpg'],
                                    ['buy','sell']
                               );
                               const message = MessageFactory.attachment(card);
                               await context.sendActivity(message);
                            }
                            else {
                                await context.sendActivity("I'm terribly sorry, but my developer hasn't trained me to do anything yet...");
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
            // Save state changes
            return this.conversationState.saveChanges(context);
        });

        this.onConversationUpdate(async (context: TurnContext): Promise<void> => {
            if (context.activity.membersAdded && context.activity.membersAdded.length !== 0) {
                for (const idx in context.activity.membersAdded) {
                    if (context.activity.membersAdded[idx].id === context.activity.recipient.id) {                        
                        const welcomeCard = CardFactory.adaptiveCard(WelcomeTeammateCard);
                        await context.sendActivity({ attachments: [welcomeCard] });
                    }
                }
            }
        });

        this.onMessageReaction(async (context: TurnContext): Promise<void> => {
            const added = context.activity.reactionsAdded;
            if (added && added[0]) {
                await context.sendActivity({
                    textFormat: "xml",
                    text: `That was an interesting reaction (<b>${added[0].type}</b>)`
                });
            }
        });
   }

}
