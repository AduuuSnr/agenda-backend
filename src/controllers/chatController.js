const {httpResponse} = require("../utils/helpers");
// const Chat = require("../models_mongo/Chat.js");
const GroupChat = require("../models_mongo/ChatRoom.js");
const User = require("../models_mysql/UserModel.js");
const md5 = require("md5");
const notify = require("../utils/notify");

exports.send = async (req, res, next) => {

    // try {
    //     const {sender, reciever, message} = req.body;
    //     //console.log(sender, reciever)
    //     const conversation = await Chat.findOne({sender, reciever})
    //     const findnext = await Chat.findOne({sender:reciever, reciever:sender})
    //
    //     if(conversation?.messages?.length > 0  ){
    //         conversation.messages.push(message)
    //         await conversation.save()
    //
    //         return httpResponse(res, 200, "success", conversation);
    //
    //     } else if(findnext?.messages?.length > 0  ){
    //         findnext.messages.push(message)
    //         await findnext.save()
    //
    //         return httpResponse(res, 200, "success", findnext);
    //
    //     } else {
    //         const send = await Chat.create({sender, reciever, messages: message})
    //         return httpResponse(res, 200, "success", send);
    //
    //     }
    //
    //
    // } catch (error) {
    //     return httpResponse(res, 200, "error", error.toString());
    // }

    try {
        const {sender, group, message, reciever} = req.body;

        const conversation = await GroupChat.findOne({$or: [{members: [reciever, sender]}, {members: [sender, reciever]}]})
        let text;
        if (message?.text) {
            text = message.text
        } else {
            text = "New File"
        }


        if (conversation?.members.includes(sender)) {
            console.log("chat group message find")
            conversation.messages.push(message)
            await conversation.save()
            // console.log(message)

            /*** Send Notification ***/
            const getUser = await User.prototype.getUser(reciever);
            await notify({
                messages: {"en": text},
                template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                headings: {"en": getUser[0].fullname},
                userId: reciever
            })
            return httpResponse(res, 200, "success", conversation);
        } else {

            const roomIdentity = md5(Math.floor(Math.random(1000) * 10) + new Date().getTime())
            const send = await GroupChat.create({
                owner: sender,
                roomIdentity: roomIdentity,
                type: "personalChat",
                members: [sender, reciever],
                messages: message
            })
            console.log("room created")
            /*** Send Notification ***/
            const getUser = await User.prototype.getUser(reciever);
            await notify({
                messages: {"en": message.text},
                template: "d4abd3d0-6ac7-4880-9f95-68b778624ff2",
                headings: {"en": text},
                userId: reciever
            })
            return httpResponse(res, 200, "success", send);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }


}

exports.getConversations = async (req, res, next) => {

    const {userId} = req.body;

    const groupConversations = await GroupChat.find({members: userId})

    //console.log(groupConversations)

    if (groupConversations.length > 0) {

        for (let i = 0; i < groupConversations.length; i++) {
            //console.log(groupConversations[i])
            let membersArr = [];
            for (let mem = 0; mem < groupConversations[i].members.length; mem++) {
                let user = await User.prototype.getUser(groupConversations[i].members[mem])
                user = user[0];
                //delete user['password'];
                membersArr = [...membersArr, user];
            }

            groupConversations[i].members = membersArr

        }

        const conversations = {
            //personalMessages: conversation,
            chatHistory: groupConversations
        }

        httpResponse(res, 200, "success", conversations);
    } else {
        httpResponse(res, 200, "success", "No Messages");
    }
    // +else if(conversation2.length > 0) {
    //     conversation2.sender = await User.prototype.getUser(conversation2.sender);
    //     conversation2.reciever = await User.prototype.getUser(conversation2.reciever);
    //     const conversations = {
    //         //personalMessages: conversation2,
    //         chatHistory: groupConversations
    //     }
    //     httpResponse(res, 200, "success", conversations);
    // }

}

exports.getConversation = async (req, res, next) => {
    //const {sender, reciever} = req.body;
    // console.log(sender, reciever)
    // const conversation = await Chat.find({sender, reciever})
    // const conversation2 = await Chat.find({sender: reciever, reciever: sender})
    //
    // if(conversation.length > 0) {
    //     httpResponse(res, 200, "success", conversation);
    // } else if(conversation2.length > 0) {
    //     httpResponse(res, 200, "success", conversation2);
    // } else {
    //     httpResponse(res, 200, "success", "No Messages");
    // }

    const {sender, roomIdentity} = req.body;
    const conversation = await GroupChat.find({roomIdentity: roomIdentity})

    if (conversation.length > 0) {
        const messages = conversation[0].messages
        //console.log(messages)
        let notSeen = [];
        messages.map(chat => {
            if(!chat.received) {
                notSeen = [...notSeen, chat._id]
            }
            // console.log(chat.user._id)
        })
        //console.log(notSeen)


        httpResponse(res, 200, "success", "Room found", conversation);
    } else {
        httpResponse(res, 200, "success", "No Messages");
    }

}

/*** Group Chat ***/

exports.sendGroup = async (req, res, next) => {

    try {
        const {sender, group, message, members, roomName} = req.body;
        // console.log(group)
        const conversation = await GroupChat.findOne({roomIdentity: group})
        // console.log(conversation)
        if (conversation?.members.includes(sender)) {
            console.log("chat group message find")
            conversation.messages.push(message)
            await conversation.save()
            return httpResponse(res, 200, "success", conversation);

        } else {
            const roomIdentity = md5(Math.floor(Math.random(1000) * 10) + new Date().getTime())
            const send = await GroupChat.create({
                owner: sender,
                roomIdentity: roomIdentity,
                roomName: roomName,
                members,
                messages: message
            })
            console.log("room created")
            return httpResponse(res, 200, "success", send);
        }

    } catch (error) {
        return httpResponse(res, 200, "error", error.toString());
    }

}

exports.getConversationGroup = async (req, res, next) => {
    const {sender, group} = req.body;
    const conversation = await GroupChat.find({roomIdentity: group})
    // console.log(conversation.length)
    if (conversation.length > 0) {
        httpResponse(res, 200, "success", "Room found", conversation);
    } else {
        httpResponse(res, 200, "success", "No Messages");
    }


}