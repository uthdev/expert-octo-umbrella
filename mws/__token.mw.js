module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        if(!req.headers.token){
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
        let decoded = null
        try {
            decoded = managers.token.verifyShortToken({token: req.headers.token});
            if(!decoded){
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            };
        } catch(err){
            return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
        }
    
        next(decoded);
    }
}