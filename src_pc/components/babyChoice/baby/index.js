import Taro, { Component } from '@tarojs/taro';
import { View, Checkbox, Text, Image } from '@tarojs/components';
import './icnofont.scss';
import './index.scss';
import MyPagination from '../../myPagination/index';
import { taobaoItemListGet } from 'tradePublic/itemTopApi/taobaoItemListGet.js';
import { getInterceptBabySelectDataSource } from 'tradePublic/intercept/index.js'

class BabyContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fields: 'title,num_iid,pic_url,num,price,sold_quantity,outer_id',
            page: 1,
            status: '出售中',
            list: [],
            total_results: '',
            current: 1,
            order_by: 'list_time:desc',
            keywords: '',
            cheackList: [],
            checkAll: false,
            classList: [],
            seller_cids: 'all',
            changeWord: '宝贝关键词',
            totalNum: 0,
            newData: [],
            errTxt: ''
        }
    }
    //分类接口
    getClasstify = () => {
        getInterceptBabySelectDataSource(
            (data) => {
                this.setState({
                    classList: data
                })
            }
        );
    }
    //接口调取数据,非商家编码
    getList = () => {
        Taro.showLoading({
            title: 'loading'
          })
        taobaoItemListGet(
            {
                fields: this.state.fields,
                page_no: this.state.current,
                page_size: 20,
                status: this.state.status,
                extraArgs: {
                    order_by: this.state.order_by,
                    q: this.state.keywords,
                    seller_cids: this.state.seller_cids
                },
                callback: (data) => {
                    console.log(data);
                    let num = 0;
                    if (data.total_results > 0) {
                        let newList = data.items.item.map((item, index) => {
                            item.pic_url = item.pic_url + '_60x60.jpg';
                            item.checked = false;
                            if (this.state.cheackList.indexOf(item.num_iid) !== -1) {
                                num += 1;
                                item.checked = true;
                            }
                            return item;
                        })
                        if (num === 20) {
                            this.setState({
                                checkAll: true
                            })
                        } else {
                            this.setState({
                                checkAll: false
                            })
                        }
                        this.setState({
                            list: newList,
                            total_results: data.total_results,
                            keywords: ''
                        })
                        Taro.hideLoading()
                    } else {
                        this.setState({
                            list: []
                        })
                    }

                }
            }
        )
    }

    //重新进行封装
    taobaoItemListGetPromise = (page) => {
        return new Promise((resolve) => {
            taobaoItemListGet(
                {
                    fields: this.state.fields,
                    page_no: page,
                    page_size: 20,
                    status: this.state.status,
                    extraArgs: {
                        order_by: this.state.order_by,
                        seller_cids: this.state.seller_cids
                    },
                    callback: (data) => {
                        console.log(data);
                        if (data.total_results > 0) {
                            let newList = data.items.item.map((item, index) => {
                                item.pic_url = item.pic_url + '_60x60.jpg';
                                item.checked = false;
                                if (this.state.cheackList.indexOf(item.num_iid) !== -1) {
                                    item.checked = true;
                                }
                                return item;
                            })
                            resolve({ data: newList, num: data.total_results })
                        } else {
                            resolve([])
                        }
                    }
                }
            )
        })
    }

    //接口调取数据,非商家编码
    getListbyId = async () => {
        Taro.showLoading({
            title: 'loading'
          })
        const data = await this.taobaoItemListGetPromise(1);
        if (data.num > 0) {
            const totalNum = data.num;
            const pageSize = Math.ceil(totalNum / 20);
            const primiseArray = [];
            const allData = [];
            for (let i = 1; i <= pageSize; i++) {
                const promiseItem = this.taobaoItemListGetPromise(i);
                primiseArray.push(promiseItem)
            }
            Promise.all(primiseArray).then(values => {
                for (let i = 0; i < values.length; i++) {
                    allData.push(...values[i].data)
                }
                const newData = allData.filter((item) => {
                    return item.outer_id === this.state.keywords
                })
                this.setState({
                    list: newData.slice(0, 20),
                    total_results: newData.length,
                    newData: newData,
                    keywords: ''
                })
            })
            Taro.hideLoading()
        } else {
            this.setState({
                list: []
            })
        }
    }
    //查询商家编码接口

    //切换商品状态
    changeStatus = (e) => {
        this.setState({
            status: e.detail.value
        })
    }
    //选择分类
    changeClasstify = (e) => {
        this.setState({
            seller_cids: e.detail.value
        })
    }
    //切换查询关键词
    changeWord = (e) => {
        this.setState({
            changeWord: e.detail.value
        })
    }
    //点击页数
    changePage = (current) => {
        if (this.state.changeWord === '宝贝关键词') {
            this.setState({
                current: current,
                checkAll: false
            }, () => {
                this.getList();
            })
        } else {
            if (current === 1) {
                this.setState({
                    current: current,
                    checkAll: false,
                    list: this.state.newData.slice(0, 20)
                })
            } else {
                this.setState({
                    current: current,
                    checkAll: false,
                    list: this.state.newData.slice((current - 1) * 20, current * 20)
                })
            }
        }

    }
    //确定查询
    serach = () => {
        if (this.state.changeWord === '宝贝关键词') {
            this.setState({
                current: 1,
                order_by: 'list_time:desc',
                cheackList: [],
                checkAll: false
            }, () => {
                this.getList();
            })
        } else {
            this.setState({
                current: 1,
                order_by: 'list_time:desc',
                cheackList: [],
                checkAll: false,
                newData: []
            }, () => {
                this.getListbyId();
            })
        }

    }
    //点击排序
    orderBy = (value) => {
        if (this.state.changeWord === '宝贝关键词') {
            this.setState({
                order_by: value,
                cheackList: [],
                checkAll: false
            }, () => {
                this.getList();
            })
        } else {
            this.setState({
                order_by: value,
                cheackList: [],
                checkAll: false
            }, () => {
                this.getListbyId();
            })
        }
    }
    //输入关键词
    valueChange = (e) => {
        this.setState({
            keywords: e.target.value
        })
        console.log(e.target.value)
    }
    //cheackbox,单选
    changeChecked = (e) => {
        if (this.state.cheackList.length >= 500) {
            this.limit('最多只能选择500个宝贝！');
        } else {
            let id = e.target.id;
            let index = e.target.dataset.index;
            let newList = this.state.list;
            newList[index].checked = !newList[index].checked;
            if (e.target.value) {
                this.setState({
                    cheackNum: this.state.cheackNum + 1,
                    list: newList,
                    cheackList: [...this.state.cheackList, id]
                })
            } else {
                let index = this.state.cheackList.indexOf(id);
                let newCheackList = this.state.cheackList;
                newCheackList.splice(index, 1);
                this.setState({
                    cheackNum: this.state.cheackNum - 1,
                    list: newList,
                    cheackList: newCheackList,
                    checkAll:false
                })
            }
        }

    }
    //全选
    checkAll = (e) => {
        let newList = this.state.list;
        const newCheackList = this.state.cheackList;
        if (newCheackList.length + 20 > 500) {
            this.limit('最多选择500个宝贝!')
        } else {
            if (e.target.value) {
                newList.map((item) => {
                    newCheackList.push(item.num_iid)
                    item.checked = true;
                    return item
                })
                let arr = new Set(newCheackList);
                this.setState({
                    list: newList,
                    cheackList: Array.from(arr),
                    checkAll: true
                })
            } else {
                newList.map((item) => {
                    let index = newCheackList.indexOf(item.num_iid);
                    newCheackList.splice(index, 1);
                    item.checked = false;
                    return item
                })
                this.setState({
                    list: newList,
                    cheackList: newCheackList,
                    checkAll: false
                })
            }
        }

    }
    //点击提交
    submit = () => {
        console.log('======选择到的cheacked的数据');
        console.log(this.state.cheackList);
        if (this.state.cheackList.length === 0) {
            this.limit('还未选择宝贝');
        }
    }
    //限制宝贝的选择
    limit = (txt) => {
        this.setState({
            errTxt: txt
        })
        setTimeout(() => {
            this.setState({
                errTxt: ''
            })
        }, 2000)
    }

    componentDidMount() {
        //初始化页面数据，获取出售中的商品
        this.getList();
        //获取分类
        this.getClasstify();
    }
    render() {
        const { list, total_results, current, order_by, keywords, checkAll, cheackList, classList, errTxt } = this.state;
        return (
            <View className='baby-content'>
                {
                    errTxt.length > 0 && (
                        <View className='hint'>
                            <View className='iconfont err'>&#xe613;</View>
                            <View className='errTxt'>{errTxt}</View>
                        </View>
                    )
                }

                <View className='select-box'>
                    <View className='select1'>
                        <select className='select' onChange={this.changeStatus} onToggleHighlightItem="onToggleHighlightItem" defaultValue="出售中" showSearch hasClear >
                            <option value="出售中">出售中</option>
                            <option value="仓库中">仓库中</option>
                            <option value="已售完">已售完</option>
                        </select>
                    </View>
                    <View className='select2'>
                        <select className='select' defaultValue="全部分类" onChange={this.changeClasstify}>
                            {
                                classList.map((item) => {
                                    return (
                                        <option value={item.value} key={item.value}>{item.label}</option>
                                    )
                                })
                            }
                        </select>
                    </View>
                    <View className='select3'>
                        <select className='select' defaultValue="宝贝关键词" onChange={this.changeWord}>
                            <option value="宝贝关键词">宝贝关键词</option>
                            <option value="商家编码">商家编码</option>
                        </select>
                        <View className='input-box'>
                            <View className='iconfont icno'>&#xe620;</View>
                            <Input className='input' placeholder="请输入搜索内容" value={keywords} onChange={this.valueChange} />
                        </View>
                    </View>
                    <View className='btu-search'>
                        <Button className='btu' onClick={this.serach}>搜索</Button>
                    </View>
                </View>
                <View className='babyList'>
                    <View className='muen'>
                        <checkbox className='cheack-all' id='all' onChange={this.checkAll} values='123' checked={checkAll}>全选</checkbox>
                        <View className='name'>宝贝信息</View>
                        <View className='price'>价格</View>
                        <View className='inventory'>
                            <View className='txt'>库存</View>
                            <View className='oper'>
                                <View className={`iconfont icno-up ${order_by === 'num:asc' ? 'action' : ''}`} onClick={this.orderBy.bind(this, 'num:asc')}>&#xe62a;</View>
                                <View className={`iconfont icno-down ${order_by === 'num:desc' ? 'action' : ''}`} onClick={this.orderBy.bind(this, 'num:desc')}>&#xe634;</View>
                            </View>
                        </View>
                        <View className='sales'>
                            <View className='txt'>销量</View>
                            <View className='oper'>
                                <View className={`iconfont icno-up ${order_by === 'sold_quantity:asc' ? 'action' : ''}`} onClick={this.orderBy.bind(this, 'sold_quantity:asc')}>&#xe62a;</View>
                                <View className={`iconfont icno-down ${order_by === 'sold_quantity:desc' ? 'action' : ''}`} onClick={this.orderBy.bind(this, 'sold_quantity:desc')}>&#xe634;</View>
                            </View>
                        </View>
                    </View>
                    <View className='content'>
                        {
                            list.length == 0 && (
                                <View className='empty'>
                                    <View className='imgBlock'></View>
                                    <View className='txt'>未找到符合条件的宝贝</View>
                                </View>
                            )
                        }
                        {
                            list.length > 0 && list.map((item, index) => {
                                return (
                                    <checkbox className='baby-info' key={item.num_iid} onChange={this.changeChecked} id={item.num_iid} checked={item.checked} data-index={index}>
                                        <image src={item.pic_url} className='img'></image>
                                        <View className='name'>{item.title}</View>
                                        <View className='price'>¥{item.price}</View>
                                        <View className='inventory'>{item.num}</View>
                                        <View className='sales'>{item.sold_quantity}</View>
                                    </checkbox>
                                )
                            })
                        }
                    </View>
                </View>
                {
                    list.length > 0 && (
                        <View className='page-box'>
                            <View className='page'>
                                <MyPagination
                                    total={total_results}
                                    pageNo={current}
                                    pageSizeSelector='dropdown'
                                    pageSize={20}
                                    onPageNoChange={this.changePage}
                                />
                            </View>
                            <View className='btu-box'>
                                <Button className='btu-sub' onClick={this.submit}>确定（{cheackList.length}/{total_results}）</Button>
                            </View>

                        </View>
                    )
                }
            </View>
        );
    }
}

export default BabyContent;